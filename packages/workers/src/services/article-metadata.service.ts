import Parser from 'rss-parser';
import { isProbablyReaderable, Readability } from '@mozilla/readability';
import { z } from 'zod';
import urlMetadata from 'url-metadata';
import DOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';
import config from '../config';
import feedService from './feed.service';
import { ArticleMetadata, Feed, ReadableArticle, ProcessArticlesOptions } from '@clairvue/types';
import cacheService from './readable-article.service';
import { createHash } from 'crypto';
import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!redisClient) {
    redisClient = new Redis(config.redis);
  }

  return redisClient;
}

function hashLink(link: string): string {
  const hash = createHash('sha256').update(link).digest('hex');
  return hash.substring(0, 16);
}

async function parseFeed(url: string): Promise<Parser.Output<Parser.Item> | undefined> {
  const parser = new Parser({
    timeout: 40000, // 40 seconds
    headers: {
      'User-Agent': config.app.userAgent
    }
  });

  try {
    const feed = await parser.parseURL(url);
    return feed;
  } catch (error) {
    console.error(
      `Feed with url: ${url} could not be parsed, trying to find RSS or Atom feed link`,
      error
    );

    const feedLink = await feedService.tryGetFeedLink(url);

    if (!feedLink) {
      throw new Error('No valid feed found');
    }

    return parseFeed(feedLink);
  }
}

async function fetchFeedArticles(link: string) {
  try {
    const feed = await parseFeed(link);

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
    if (error instanceof Error) {
      console.error('Error occurred while fetching feed articles:', error.message);
    } else {
      console.error(`Unknown error occurred while fetching feed articles ${error}`);
    }
    return undefined;
  }
}

async function fetchAndProcessArticles(
  articles: Parser.Item[],
  options: ProcessArticlesOptions = { chunkSize: 10, parallelDelay: 1000 }
): Promise<ArticleMetadata[]> {
  const { chunkSize, parallelDelay } = options;
  const articleMetadata: ArticleMetadata[] = [];

  const chunks = Array.from({ length: Math.ceil(articles.length / chunkSize) }, (_, i) =>
    articles.slice(i * chunkSize, i * chunkSize + chunkSize)
  );

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (article) => {
        return await getArticleMetadata(article);
      })
    );

    articleMetadata.push(
      ...chunkResults.filter((article): article is ArticleMetadata => Boolean(article))
    );

    await new Promise((resolve) => setTimeout(resolve, parallelDelay));
  }

  return articleMetadata;
}

async function getArticlesMetadata(
  feed: Feed,
  jobContext: string = 'None'
): Promise<ArticleMetadata[]> {
  try {
    const orderedArticles = await fetchFeedArticles(feed.link);

    if (!orderedArticles) return [];

    console.info(`[${jobContext}] Syncing ${orderedArticles.length} articles from ${feed.name}...`);

    const articles = await fetchAndProcessArticles(orderedArticles);

    if (!articles || articles.length === 0) {
      console.info(`[${jobContext}] No new articles found.`);
      return [];
    }

    console.info(`[${jobContext}] ${articles.length} new articles found.`);
    return articles;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[${jobContext}] Error occurred while fetching feed articles:`, error.message);
    } else {
      console.error(`[${jobContext}] Unknown error occurred while fetching feed articles ${error}`);
    }
    return [];
  }
}

function validateLink(link: string | undefined): link is string {
  if (!link) return false;
  if (!z.string().url().safeParse(link).success) return false;
  return true;
}

async function getArticleMetadata(article: Parser.Item): Promise<ArticleMetadata | undefined> {
  const { link, title } = article;
  const pubDate = article.pubDate ?? article.isoDate;

  if (!validateLink(link)) {
    return undefined;
  }

  const siteName = new URL(link).hostname.replace('www.', '');

  const existingArticleMetadata = await getCachedArticleMetadata(link);

  if (existingArticleMetadata) {
    return undefined;
  }

  console.info(`Processing article: ${link}`);

  const partialMetadata = await fetchArticleMetadata(link, title);

  const articleMetadata = {
    ...partialMetadata,
    title: title ?? partialMetadata?.title ?? 'Untitled',
    readable: partialMetadata?.readable ?? false,
    publishedAt: pubDate ? new Date(pubDate) : new Date(),
    link,
    siteName
  };
  cacheArticleMetadata(link, articleMetadata);
  return articleMetadata;
}

async function fetchAndCleanDocument(
  link: string,
  ua?: string | null
): Promise<Document | undefined> {
  const userAgent = ua || config.app.userAgent;
  const timeout = 20000; // 20 seconds

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`Timeout reached while fetching article with link ${link}`);
    }, timeout);

    const pageResponse = await fetch(link, {
      headers: { 'User-Agent': userAgent },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!pageResponse.ok) {
      console.error(
        `Error occurred while fetching article with link ${link}: ${pageResponse.statusText}`
      );
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
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`Timeout reached while fetching article with link ${link}`);
      } else {
        console.error(`Error occurred while fetching article: ${error}`);
      }
    } else {
      console.error(`Unknown error occurred while fetching article ${error}`);
    }
    return undefined;
  }
}

async function getMimeType(url: string, ua: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': ua } });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const mimeType = response.headers.get('content-type');
    return mimeType ?? undefined;
  } catch (error) {
    console.error('Error fetching MIME type:', error);
    return undefined;
  }
}

async function fetchArticleMetadata(
  link: string,
  title?: string
): Promise<Partial<ArticleMetadata> | undefined> {
  try {
    const ua = config.app.userAgent;

    const mimeType = await getMimeType(link, ua);
    if (!mimeType || !mimeType.startsWith('text/html')) {
      console.error(`File with link ${link} is not an HTML file or could not be fetched`);
      return {
        title,
        link,
        readable: false
      };
    }

    const readableArticle = await fetchReadableArticle(link);
    const readable = !!readableArticle;

    const metadata = await urlMetadata(link, {
      timeout: 10000,
      requestHeaders: {
        'User-Agent': ua
      }
    });

    if (readable) {
      createReadableArticleCache(link, readableArticle);
    }

    const articleMetadata = extractArticleMetadata(metadata, new URL(link).hostname);

    if (!articleMetadata) {
      return undefined;
    }

    return {
      ...articleMetadata,
      readable
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `Error occurred while fetching metadata for article with link ${link}:`,
        error.message
      );
    } else {
      console.error('Error occurred while fetching metadata');
    }
    return undefined;
  }
}

function extractArticleMetadata(
  metadata: urlMetadata.Result | undefined,
  domain: string
): Partial<ArticleMetadata> | undefined {
  if (!metadata) {
    return undefined;
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

  return { title, description, image: validImageUrl, author, readable: false };
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

async function createReadableArticleCache(
  link: string,
  readableArticle: ReadableArticle
): Promise<void> {
  if (readableArticle) {
    await cacheService.cacheReadableArticle(link, readableArticle);
  }

  return;
}

async function fetchReadableArticle(link: string): Promise<ReadableArticle | undefined> {
  if (!validateLink(link)) {
    return undefined;
  }

  const document = await fetchAndCleanDocument(link, config.app.userAgent);

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
    const parsedArticle = new Readability(document).parse();
    if (!parsedArticle) {
      console.error('Error occurred while parsing article');
      return undefined;
    }

    // Hash the content to check for updates
    const hash = createHash('sha256').update(parsedArticle.textContent).digest('hex');
    const readableArticle: ReadableArticle = {
      ...parsedArticle,
      contentHash: hash
    };

    return readableArticle;
  }

  return undefined;
}

async function getUpdatedReadableArticle(link: string): Promise<ReadableArticle | undefined> {
  const existingReadableArticle = await cacheService.getCachedReadableArticle(link);

  const readableArticle = await fetchReadableArticle(link);

  if (!readableArticle) {
    return undefined;
  }

  const newHash = createHash('sha256').update(readableArticle.textContent).digest('hex');

  if (existingReadableArticle && existingReadableArticle.contentHash === newHash) {
    console.log(`Compared article hash ${existingReadableArticle.contentHash} with ${newHash}`);
    return undefined;
  }

  await cacheService.cacheReadableArticle(link, readableArticle);

  return readableArticle;
}

async function getCachedArticleMetadata(link: string): Promise<ArticleMetadata | null> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    return null;
  }

  const cached = await redis.get(`article-metadata:${hashLink(link)}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

async function cacheArticleMetadata(link: string, article: ArticleMetadata): Promise<void> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    throw new Error('Link is required');
  }

  const expirationTime = 24 * 60 * 60; // 1 day
  await redis.set(
    `article-metadata:${hashLink(link)}`,
    JSON.stringify(article),
    'EX',
    expirationTime
  );
}

async function deleteArticleMetadataCache(link: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    throw new Error('Link is required');
  }

  await redis.del(`article-metadata:${hashLink(link)}`);
}

export default {
  getArticlesMetadata,
  getArticleMetadata,
  fetchAndCleanDocument,
  getCachedArticleMetadata,
  cacheArticleMetadata,
  deleteArticleMetadataCache,
  fetchArticleMetadata,
  extractArticleMetadata,
  isNewsArticle,
  getUpdatedReadableArticle
};
