import Parser from 'rss-parser';
import articleRepository from '../repositories/article';
import type { RssFeed } from '../schema';
import { getLinkPreview } from 'link-preview-js';

export async function fetchRssFeedArticles(link: string) {
	const parser = new Parser();
	const feed = await parser.parseURL(link);

	if (!feed || !feed.items || feed.items.length === 0) return undefined;

	feed.items.sort((a, b) => {
		if (a.pubDate && b.pubDate) {
			return new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf();
		} else {
			return 0; // Or handle the case where pubDate is undefined
		}
	});

	return feed.items;
}

export async function syncArticlesParallel(rssFeed: RssFeed) {
	const orderedArticles = await fetchRssFeedArticles(rssFeed.link);

	if (!orderedArticles) return;

	const createdArticles: string[] = [];

	await Promise.all(
		orderedArticles.map(async (article) => {
			if (!article.link) return;

			const articleExists = await articleRepository.findByLink(article.link);
			if (articleExists) {
				return; // Skip further processing if article exists
			}

			const linkPreview = await getLinkPreview(article.link, {
				timeout: 2000,
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
				}
			});

			if (!linkPreview || !isPreviewTypeHtml(linkPreview)) {
				return; // Skip further processing if no link preview or not HTML
			}

			if (!linkPreview.siteName) {
				const domainMatch = article.link.match(
					/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)\//i
				);
				linkPreview.siteName = domainMatch?.[1] || '';
			}

			const newArticle = {
				rssFeedId: rssFeed.id,
				title: linkPreview.title,
				link: article.link,
				description: article.description || linkPreview.description || '',
				siteName: linkPreview.siteName,
				image: linkPreview.images?.[0] || '',
				publishedAt: new Date(article.pubDate as string)
			};

			console.log(newArticle);

			const articleId = await articleRepository.create(newArticle);

			if (articleId) {
				createdArticles.push(articleId);
			}
		})
	);

	console.log(`[Sync] Synced ${createdArticles.length} articles.`);
	return createdArticles;
}

export async function syncArticlesSequential(rssFeed: RssFeed) {
	const orderedArticles = await fetchRssFeedArticles(rssFeed.link);

	if (!orderedArticles) return;

	console.log(`[Sync] Syncing ${orderedArticles.length} articles...`);

	const createdArticles: string[] = [];

	// Check articles sequentially until finding the first unsaved article
	for (const article of orderedArticles) {
		if (!article.link) continue;

		const articleExists = await articleRepository.findByLink(article.link);
		if (articleExists) {
			continue; // Skip further processing if article exists
		}

		const linkPreview = await getLinkPreview(article.link, {
			timeout: 2000,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
			}
		});

		if (!linkPreview || !isPreviewTypeHtml(linkPreview)) {
			continue; // Skip further processing if no link preview or not HTML
		}

		if (!linkPreview.siteName) {
			const domainMatch = article.link.match(
				/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)\//i
			);
			linkPreview.siteName = domainMatch?.[1] || '';
		}

		const newArticle = {
			rssFeedId: rssFeed.id,
			title: article.title || linkPreview.title,
			link: article.link,
			description: article.description || linkPreview.description || '',
			siteName: linkPreview.siteName,
			image: linkPreview.images?.[0] || '',
			publishedAt: new Date(article.pubDate as string)
		};

		const articleId = await articleRepository.create(newArticle);

		if (articleId) {
			createdArticles.push(articleId);
		}
	}

	console.log(`[Sync] Synced ${createdArticles.length} articles.`);
	return createdArticles;
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
