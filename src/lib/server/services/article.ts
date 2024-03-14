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
import type { NewArticle } from '@/types/NewArticle';

interface ProcessArticlesOptions {
	chunkSize?: number;
	parallelDelay?: number;
}

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

export async function syncArticles(rssFeed: RssFeed) {
	try {
		const orderedArticles = await fetchRssFeedArticles(rssFeed.link);

		if (!orderedArticles) return;

		console.log(`[Sync] Syncing ${orderedArticles.length} articles from ${rssFeed.name} ...`);

		const newArticles = await processArticles(rssFeed, orderedArticles);

		if (!newArticles || newArticles.length === 0) {
			console.log('[Sync] No new articles found.');
			return;
		}

		const createdArticles = await saveArticles(newArticles);

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

async function fetchArticleMetadata(link: string): Promise<ArticleMetadata | undefined> {
	try {
		const metadata = await urlMetadata(link, {
			timeout: 10000,
			requestHeaders: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
			}
		});

		return extractArticleMetadata(metadata, new URL(link).hostname);
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error occurred while fetching metadata:', error.message);
		} else {
			console.error('Error occurred while fetching metadata');
		}
	}
}

async function createNewArticle(
	rssFeed: RssFeed,
	article: Parser.Item
): Promise<NewArticle | undefined> {
	const { link, pubDate, title } = article;

	if (!link) return;

	if (!z.string().url().safeParse(link).success) return;

	const existingArticle = await articleRepository.existsWithLink(link);

	// TODO: Allow duplicate articles if the existing article is too old
	if (existingArticle) return;

	console.log(`[Sync] Processing article: ${link}`);

	const articleMetadata = await fetchArticleMetadata(link);

	const newArticle: NewArticle = {
		rssFeedId: rssFeed.id,
		title: title || articleMetadata?.title || 'Untitled',
		link,
		description: articleMetadata?.description || null,
		siteName: new URL(link).hostname.replace('www.', ''),
		image: articleMetadata?.image || null,
		author: articleMetadata?.author || null,
		publishedAt: new Date(pubDate as string)
	};

	return newArticle;
}

async function processArticles(
	rssFeed: RssFeed,
	articles: Parser.Item[],
	options: ProcessArticlesOptions = {}
): Promise<NewArticle[]> {
	const { chunkSize = 10, parallelDelay = 1000 } = options;
	const newArticles: NewArticle[] = [];

	const chunks = Array.from({ length: Math.ceil(articles.length / chunkSize) }, (_, i) =>
		articles.slice(i * chunkSize, i * chunkSize + chunkSize)
	);

	for (const chunk of chunks) {
		const chunkResults = await Promise.all(
			chunk.map((article) => createNewArticle(rssFeed, article))
		);
		newArticles.push(...chunkResults.filter((article): article is NewArticle => !!article));
		await new Promise((resolve) => setTimeout(resolve, parallelDelay));
	}

	return newArticles;
}

async function saveArticles(newArticles: NewArticle[]): Promise<string[] | undefined> {
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

		const cleanHtml = DOMPurify.sanitize(html, {
			FORBID_TAGS: ['script', 'style', 'title', 'noscript', 'iframe'],
			FORBID_ATTR: ['style', 'class']
		});

		const dom = new JSDOM(cleanHtml, { url: link });

		document = dom.window.document;
	} catch (error) {
		console.error(`Error occurred while fetching article: ${error}`);
		return undefined;
	}

	//TODO: play with the options of Readability
	if (isProbablyReaderable(document)) {
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

	const title =
		metadata.title ||
		metadata['og:title'] ||
		metadata['twitter:title'] ||
		(Array.isArray(metadata.jsonld) &&
			metadata.jsonld.length > 0 &&
			(isNewsArticle(metadata.jsonld[0])
				? metadata.jsonld[0].headline
				: metadata.jsonld.find(isNewsArticle)?.headline));

	// Extract author

	const author =
		metadata.author ||
		metadata['og:author'] ||
		metadata['twitter:creator'] ||
		(metadata.jsonld && typeof metadata.jsonld.author === 'string' && metadata.jsonld.author) ||
		(metadata.jsonld && Array.isArray(metadata.jsonld) && metadata.jsonld[1]?.author?.[0]?.name) ||
		(metadata.jsonld && metadata.jsonld.author?.name) ||
		(metadata.jsonld && metadata.jsonld.publisher?.name);

	// Extract description
	const description =
		metadata.description || metadata['og:description'] || metadata['twitter:description'] || null;

	// Extract image
	const image: string =
		metadata.image ||
		metadata['og:image'] ||
		metadata['twitter:image'] ||
		metadata['twitter:image:src'] ||
		metadata['og:image:secure_url'] ||
		metadata['twitter:image:src'] ||
		(metadata.jsonld && metadata.jsonld[1]?.image?.[0]?.url) ||
		null;

	// Validate image URL
	let validImageUrl: string | undefined;

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

	//Check if the string can be separated by comma
	if (validImageUrl && validImageUrl.includes(',')) {
		const imageArray = image.split(',');
		validImageUrl = imageArray[0];
	}

	return { title, description, image: validImageUrl, author };
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
