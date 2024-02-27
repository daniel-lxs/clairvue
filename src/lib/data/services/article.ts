import Parser from 'rss-parser';
import articleRepository from '../repositories/article';
import rssFeedRepository from '../repositories/rssFeed';
import type { RssFeed } from '../schema';
import { getLinkPreview } from 'link-preview-js';
import type { NewArticle } from '@/types/NewArticle';

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
	const newArticles: NewArticle[] = [];

	const processArticle = async (article: Parser.Item) => {
		if (!article.link) return;

		const articleExists = await articleRepository.findByLink(article.link);
		if (articleExists) return;

		const linkPreview = await getLinkPreview(article.link, {
			timeout: 2000,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
			}
		});

		if (!linkPreview || !isPreviewTypeHtml(linkPreview)) return;

		if (!linkPreview.siteName) {
			const domainMatch = article.link.match(
				/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)\//i
			);
			linkPreview.siteName = domainMatch?.[1] || '';
		}

		const newArticle: NewArticle = {
			rssFeedId: rssFeed.id,
			title: article.title || linkPreview.title,
			link: article.link,
			description: article.summary || linkPreview.description || '',
			siteName: linkPreview.siteName,
			image: linkPreview.images?.[0] || '',
			publishedAt: new Date(article.pubDate as string)
		};

		newArticles.push(newArticle);
	};

	if (parallel) {
		await Promise.all(articles.map(processArticle));
	} else {
		for (const article of articles) {
			await processArticle(article);
		}
	}

	return newArticles;
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
