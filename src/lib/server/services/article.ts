import type { NewArticle } from '@/types/NewArticle';
import { isProbablyReaderable, Readability } from '@mozilla/readability';
import axios from 'axios';
import DOMPurify from 'isomorphic-dompurify';
import he from 'he';
import { JSDOM } from 'jsdom';
import urlMetadata from 'url-metadata';
import Parser from 'rss-parser';
import articleRepository from '@/server/data/repositories/article';
import rssFeedRepository from '@/server/data/repositories/rssFeed';
import type { RssFeed } from '@/server/data/schema';
import type { ParsedArticle } from '@/types/ParsedArticle';
import { z } from 'zod';
import type { ArticleMetadata } from '@/types/ArticleMetadata';

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
		const chunkSize = 10;
		const processArticle = async (article: Parser.Item) => {
			try {
				const { link, title, pubDate } = article;
				if (!link || !z.string().url().safeParse(link).success) return;

				const articleExists = await articleRepository.findByLink(link);
				if (articleExists) return;

				console.log(`[Sync] Processing article: ${link}`);

				const metadata = await urlMetadata(link, {
					timeout: 10000,
					requestHeaders: {
						'User-Agent':
							'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
					}
				}).catch((error) => {
					if (error instanceof Error) {
						console.log('Error occurred while fetching metadata:', error.message);
					} else {
						console.log('Error occurred while fetching metadata');
					}
					return undefined;
				});

				const siteName = new URL(link).hostname;

				const articleMetadata = extractArticleMetadata(metadata, siteName);

				const newArticle: NewArticle = {
					rssFeedId: rssFeed.id,
					title: articleMetadata.title || title || 'Untitled',
					link,
					description: articleMetadata.description || null,
					siteName,
					image: articleMetadata.image || null,
					publishedAt: new Date(pubDate as string)
				};

				newArticles.push(newArticle);
			} catch (error) {
				console.error('Error occurred while processing article:', error);
			}
		};

		if (parallel) {
			const chunks = Array.from({ length: Math.ceil(articles.length / chunkSize) }, (_, i) =>
				articles.slice(i * chunkSize, i * chunkSize + chunkSize)
			);

			for (const chunk of chunks) {
				await Promise.all(chunk.map(processArticle));
				await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
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

function extractArticleMetadata(
	metadata: urlMetadata.Result | undefined,
	domain: string
): ArticleMetadata {
	if (!metadata) {
		return {};
	}

	// Extract title
	const title =
		metadata.title ||
		metadata['og:title'] ||
		metadata['twitter:title'] ||
		(metadata.jsonld &&
			(isNewsArticle(metadata.jsonld)
				? metadata.jsonld.headline
				: metadata.jsonld.find(isNewsArticle)?.headline));

	// Extract description
	const description =
		metadata.description || metadata['og:description'] || metadata['twitter:description'];

	// Extract image
	const image: string =
		metadata.image ||
		metadata['og:image'] ||
		metadata['twitter:image'] ||
		metadata['twitter:image:src'] ||
		metadata['og:image:secure_url'] ||
		metadata['twitter:image:src'] ||
		(metadata.jsonld && metadata.jsonld[1]?.image?.[0]?.url) ||
		'';

	// Validate image URL
	let validImageUrl: string | undefined;

	//Check if the string can be separated by comma
	if (image && image.includes(',')) {
		const imageArray = image.split(',');
		validImageUrl = imageArray[0];
	}

	// Check if image is a relative path and add domain if needed
	if (image && !image.startsWith('http')) {
		if (domain) {
			// Construct absolute URL using domain
			const absoluteUrl = new URL(image, `https://${domain}`).href;
			validImageUrl = absoluteUrl;
		} else {
			// If domain is not available, treat the image as is
			validImageUrl = image;
		}
	} else {
		// If image is already an absolute URL, use it as is
		validImageUrl = image;
	}

	return { title, description, image: validImageUrl };
}

// Helper function to check if the given data is a NewsArticle JSON-LD object
function isNewsArticle(
	jsonldData: unknown
): jsonldData is { '@type': 'NewsArticle'; headline: string } {
	if (typeof jsonldData === 'object' && jsonldData !== null) {
		const data = jsonldData as { '@type'?: string; headline?: string };
		return data['@type'] === 'NewsArticle' && typeof data.headline === 'string';
	}
	return false;
}
