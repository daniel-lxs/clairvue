import type { NewArticle } from '@/types/NewArticle';
import { isProbablyReaderable, Readability } from '@mozilla/readability';
import axios from 'axios';
import DOMPurify from 'isomorphic-dompurify';
import he from 'he';
import { JSDOM } from 'jsdom';
import { getLinkPreview } from 'link-preview-js';
import Parser from 'rss-parser';
import articleRepository from '@/server/data/repositories/article';
import rssFeedRepository from '@/server/data/repositories/rssFeed';
import type { RssFeed } from '@/server/data/schema';
import type { ParsedArticle } from '@/types/ParsedArticle';
import { z } from 'zod';

export async function fetchRssFeedArticles(link: string) {
	try {
		const parser = new Parser();
		const feed = await parser.parseURL(link);

		if (!feed || !feed.items || feed.items.length === 0) {
			throw new Error('No feed items found');
		}

		feed.items.sort((a, b) => {
			if (a.pubDate && b.pubDate) {
				return new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf();
			} else {
				return 0; // Or handle the case where pubDate is undefined
			}
		});

		return feed.items;
	} catch (error) {
		console.error('Error fetching or parsing RSS feed:', error);
		return undefined;
	}
}

export async function syncArticles(rssFeed: RssFeed, parallel: boolean) {
	try {
		const orderedArticles = await fetchRssFeedArticles(rssFeed.link);

		if (!orderedArticles) return;

		console.log(`[Sync] Syncing ${orderedArticles.length} articles...`);

		const newArticles = await processArticles(rssFeed, orderedArticles, parallel);

		if (!newArticles || newArticles.length === 0) {
			console.log('[Sync] No new articles found.');
			return;
		}

		const createdArticles = await createArticles(newArticles);

		if (!createdArticles) {
			console.log('[Sync] No new articles created.');
			return;
		}

		await rssFeedRepository.updateLastSync(rssFeed.id, new Date());

		console.log(`[Sync] Synced ${createdArticles.length} articles.`);
		return createdArticles;
	} catch (error) {
		console.error('Error occurred during sync:', error);
	}
}

async function processArticles(
	rssFeed: RssFeed,
	articles: Parser.Item[],
	parallel: boolean
): Promise<NewArticle[]> {
	try {
		const newArticles: NewArticle[] = [];

		const processArticle = async (article: Parser.Item) => {
			try {
				if (!article.link) return;

				if (z.string().url().safeParse(article.link).success === false) return;

				const articleExists = await articleRepository.findByLink(article.link);
				if (articleExists) return;

				console.log(`[Sync] Processing article: ${article.link}`);

				const linkPreview = await getLinkPreview(article.link, {
					timeout: 2000,
					headers: {
						'User-Agent':
							'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
					}
				});

				const domainMatch = article.link.match(
					/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)\//i
				);

				let siteName = domainMatch?.[1] || '';
				let title = article.title;
				let description = article.summary;
				let image = '';

				if (linkPreview && isPreviewTypeHtml(linkPreview)) {
					siteName = linkPreview.siteName || siteName;
					title = linkPreview.title || title;
					description = linkPreview.description || description;
					image = linkPreview.images?.[0] || '';
				}

				if (!title || !siteName) return;

				const newArticle: NewArticle = {
					rssFeedId: rssFeed.id,
					title: title,
					link: article.link,
					description: description || null,
					siteName: siteName,
					image: image || null,
					publishedAt: new Date(article.pubDate as string)
				};

				newArticles.push(newArticle);
			} catch (error) {
				console.error('Error occurred while processing article:', error);
			}
		};

		if (parallel) {
			//split in chunks of 5 articles and await for each chunk to finish
			for (let i = 0; i < articles.length; i += 5) {
				const chunk = articles.slice(i, i + 5);
				await Promise.all(chunk.map(processArticle));
			}
		} else {
			for (const article of articles) {
				await processArticle(article);
			}
		}

		return newArticles;
	} catch (error) {
		console.error('Error occurred during article processing:', error);
		return [];
	}
}

async function createArticles(newArticles: NewArticle[]): Promise<string[] | undefined> {
	const createdIds = await articleRepository.create(newArticles);
	return createdIds;
}

function isPreviewTypeHtml(linkPreview: unknown): linkPreview is {
	contentType: 'text/html';
	description: string;
	images: string;
	siteName: string;
	title: string;
} {
	return (
		typeof linkPreview === 'object' &&
		linkPreview !== null &&
		'contentType' in linkPreview &&
		'description' in linkPreview &&
		'images' in linkPreview &&
		'siteName' in linkPreview &&
		'title' in linkPreview
	);
}

export async function parseReadableArticle(
	link: string,
	ua?: string | null
): Promise<ParsedArticle | undefined> {
	const userAgent =
		ua ||
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';

	let document: Document;
	try {
		const pageResponse = await axios.get<string>(link, {
			headers: {
				'User-Agent': userAgent
			},
			responseType: 'text'
		}); // Fetching from the test URL

		const html = he.decode(pageResponse.data);

		const sanitizedHtml = html
			.replace(/<style([\S\s]*?)>([\S\s]*?)<\/style>/gim, '')
			.replace(/<script([\S\s]*?)>([\S\s]*?)<\/script>/gim, '');

		const cleanHtml = DOMPurify.sanitize(sanitizedHtml);

		const dom = new JSDOM(cleanHtml, { url: link });

		document = dom.window.document;

		// Modify image paths to absolute URLs
		const images = document.querySelectorAll('img');
		images.forEach((imgElement) => {
			const imgSrc = imgElement.getAttribute('src');
			if (imgSrc && !imgSrc.startsWith('http')) {
				// Convert relative image path to absolute URL
				const absoluteUrl = new URL(imgSrc, link).href;
				imgElement.setAttribute('src', absoluteUrl);
			}
		});
	} catch (error) {
		console.error(`Error occurred while fetching article: ${error}`);
		return undefined;
	}

	//TODO: play with the options of Readability
	if (isProbablyReaderable(document)) {
		// Parse the modified HTML using Readability
		const readableArticle = new Readability(document).parse();

		if (!readableArticle) {
			console.error('Error occurred while parsing article');
			return undefined;
		}

		return readableArticle;
	}
	return undefined;
}
