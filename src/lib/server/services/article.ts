import { isProbablyReaderable, Readability } from '@mozilla/readability';
import DOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';
import urlMetadata from 'url-metadata';
import Parser from 'rss-parser';
import articleRepository from '@/server/data/repositories/article';
import feedRepository from '@/server/data/repositories/feed';
import type { Feed } from '@/server/data/schema';
import type { ParsedArticle } from '@/types/ParsedArticle';
import { z } from 'zod';
import type { ArticleMetadata } from '@/types/ArticleMetadata';
import type { NewArticle } from '@/types/NewArticle';
import { Logger } from '@control.systems/logger';

const logger = new Logger('ArticleService');

interface ProcessArticlesOptions {
	chunkSize?: number;
	parallelDelay?: number;
}

export async function fetchFeedArticles(link: string) {
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
		logger.error('Error fetching or parsing feed:', error);
		return undefined;
	}
}

export async function syncArticles(feed: Feed) {
	try {
		const orderedArticles = await fetchFeedArticles(feed.link);

		if (!orderedArticles) return;

		logger.info(`Syncing ${orderedArticles.length} articles from ${feed.name}...`);

		const newArticles = await processArticles(feed, orderedArticles);

		if (!newArticles || newArticles.length === 0) {
			logger.info('No new articles found.');
			return;
		}

		const createdArticles = await saveArticles(newArticles);

		if (!createdArticles) {
			logger.info('No new articles created.');
			return;
		}

		await feedRepository.updateLastSync(feed.id, new Date());

		logger.info(`Synced ${createdArticles.length} articles.`);
		return createdArticles;
	} catch (error) {
		logger.error('Error occurred during sync:', error);
	}
}

async function fetchArticleMetadata(link: string): Promise<ArticleMetadata | undefined> {
	try {
		const ua =
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';
		const isReadable = isArticleReadable(link, ua);
		const metadata = await urlMetadata(link, {
			timeout: 10000,
			requestHeaders: {
				'User-Agent': ua
			}
		});
		const articleMetadata = extractArticleMetadata(metadata, new URL(link).hostname);
		return {
			...articleMetadata,
			readable: await isReadable
		};
	} catch (error) {
		if (error instanceof Error) {
			logger.error('Error occurred while fetching metadata:', error.message);
		} else {
			logger.error('Error occurred while fetching metadata');
		}
	}
}

async function createNewArticle(feed: Feed, article: Parser.Item): Promise<NewArticle | undefined> {
	const { link, pubDate, title } = article;

	if (!link) return;

	if (!z.string().url().safeParse(link).success) return;

	const existingArticle = await articleRepository.existsWithLink(link);

	// TODO: Allow duplicate articles if the existing article is too old
	if (existingArticle) return;

	logger.info(`Processing article: ${link}`);

	const articleMetadata = await fetchArticleMetadata(link);

	const newArticle: NewArticle = {
		feedId: feed.id,
		title: title || articleMetadata?.title || 'Untitled',
		link,
		description: articleMetadata?.description || null,
		siteName: new URL(link).hostname.replace('www.', ''),
		readable: articleMetadata?.readable || false,
		image: articleMetadata?.image || null,
		author: articleMetadata?.author || null,
		publishedAt: new Date(pubDate as string)
	};

	return newArticle;
}

async function processArticles(
	feed: Feed,
	articles: Parser.Item[],
	options: ProcessArticlesOptions = {}
): Promise<NewArticle[]> {
	const { chunkSize = 10, parallelDelay = 1000 } = options;
	const newArticles: NewArticle[] = [];

	const chunks = Array.from({ length: Math.ceil(articles.length / chunkSize) }, (_, i) =>
		articles.slice(i * chunkSize, i * chunkSize + chunkSize)
	);

	for (const chunk of chunks) {
		const chunkResults = await Promise.all(chunk.map((article) => createNewArticle(feed, article)));
		newArticles.push(...chunkResults.filter((article): article is NewArticle => !!article));
		await new Promise((resolve) => setTimeout(resolve, parallelDelay));
	}

	return newArticles;
}

async function saveArticles(newArticles: NewArticle[]): Promise<string[] | undefined> {
	const createdIds = await articleRepository.create(newArticles);
	return createdIds;
}

async function fetchAndCleanDocument(
	link: string,
	ua?: string | null
): Promise<Document | undefined> {
	const userAgent =
		ua ||
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';

	try {
		const pageResponse = await fetch(link, {
			headers: {
				'User-Agent': userAgent
			}
		});

		if (!pageResponse.ok) {
			logger.error(`Error occurred while fetching article: ${pageResponse.statusText}`);
			return undefined;
		}

		const html = await pageResponse.text();
		const cleanHtml = DOMPurify.sanitize(html, {
			FORBID_TAGS: ['script', 'style', 'title', 'noscript', 'iframe'],
			FORBID_ATTR: ['style', 'class']
		});

		const dom = new JSDOM(cleanHtml, { url: link });
		return dom.window.document;
	} catch (error) {
		logger.error(`Error occurred while fetching article: ${error}`);
		return undefined;
	}
}

export async function parseReadableArticle(
	link: string,
	ua?: string | null
): Promise<ParsedArticle | undefined> {
	const document = await fetchAndCleanDocument(link, ua);

	if (!document) {
		return undefined;
	}

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
			logger.error('Error occurred while parsing article');
			return undefined;
		}

		return readableArticle;
	}

	return undefined;
}

export async function isArticleReadable(link: string, ua?: string | null): Promise<boolean> {
	const document = await fetchAndCleanDocument(link, ua);

	if (!document) {
		return false;
	}

	return isProbablyReaderable(document);
}

function extractArticleMetadata(
	metadata: urlMetadata.Result | undefined,
	domain: string
): ArticleMetadata {
	if (!metadata) {
		return {};
	}

	const title = ((metadata: urlMetadata.Result): string | undefined => {
		const title =
			metadata.title ||
			metadata['og:title'] ||
			metadata['twitter:title'] ||
			(Array.isArray(metadata.jsonld) &&
				metadata.jsonld.length > 0 &&
				(isNewsArticle(metadata.jsonld[0])
					? metadata.jsonld[0].headline
					: metadata.jsonld.find(isNewsArticle)?.headline)) ||
			(metadata.headings &&
				metadata.headings.find((h: { level: string }) => h.level === 'h1')?.text) ||
			undefined;

		return typeof title === 'string' ? title : undefined;
	})(metadata);

	const author = ((metadata: urlMetadata.Result): string | undefined => {
		const author =
			metadata.author ||
			metadata['og:author'] ||
			(metadata.jsonld &&
				typeof metadata.jsonld === 'object' &&
				'author' in metadata.jsonld &&
				metadata.jsonld.author) ||
			(metadata.jsonld &&
				Array.isArray(metadata.jsonld) &&
				metadata.jsonld[1]?.author?.[0]?.name) ||
			(metadata.jsonld &&
				typeof metadata.jsonld.author === 'object' &&
				metadata.jsonld.author.name) ||
			(metadata.jsonld &&
				typeof metadata.jsonld.publisher === 'object' &&
				metadata.jsonld.publisher.name) ||
			metadata['twitter:creator'] ||
			undefined;
		return typeof author === 'string' ? author : undefined;
	})(metadata);

	const description = ((metadata: urlMetadata.Result): string | undefined => {
		const description =
			metadata.description ||
			metadata['og:description'] ||
			metadata['twitter:description'] ||
			undefined;

		return typeof description === 'string' ? description : undefined;
	})(metadata);

	const image = ((metadata: urlMetadata.Result): string | undefined => {
		const image =
			metadata.image ||
			metadata['og:image'] ||
			metadata['twitter:image'] ||
			metadata['twitter:image:src'] ||
			metadata['og:image:secure_url'] ||
			(metadata.jsonld && Array.isArray(metadata.jsonld) && metadata.jsonld[1]?.image?.[0]?.url) ||
			undefined;

		return typeof image === 'string' ? image : undefined;
	})(metadata);

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
		const imageArray = validImageUrl.split(',');
		validImageUrl = imageArray[0];
	}

	if (!z.string().url().safeParse(validImageUrl).success) {
		validImageUrl = undefined;
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
