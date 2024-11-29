import Parser from 'rss-parser';
import { z } from 'zod';
import urlMetadata from 'url-metadata';
import config from '../config';
import feedService from './feed.service';
import { ArticleMetadata, Feed, ReadableArticle, ProcessArticlesOptions } from '@clairvue/types';
import cacheService from './readable-article.service';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { isValidLink } from '../utils';
import readableArticleService from './readable-article.service';

let redisClient: Redis | null = null;

function initializeRedisClient(): Redis | null {
  if (!redisClient) {
    redisClient = new Redis(config.redis);
  }

  return redisClient;
}

function generateLinkHash(link: string): string {
  const hash = createHash('sha256').update(link).digest('hex');
  return hash.substring(0, 16);
}

async function retrieveFeedData(url: string): Promise<Parser.Output<Parser.Item> | undefined> {
  const parser = new Parser({
    timeout: 40000, // 40 seconds
    headers: {
      'User-Agent': config.app.userAgent
    }
  });

  try {
    return await parser.parseURL(url);
  } catch (error) {
    console.error(
      `Feed with url: ${url} could not be parsed, trying to find RSS or Atom feed link`,
      error
    );

    const feedLink = await feedService.tryGetFeedLink(url);

    if (!feedLink) {
      throw new Error('No valid feed found');
    }

    return await parser.parseURL(feedLink);
  }
}

async function retrieveArticlesFromFeed(link: string) {
  try {
    const feed = await retrieveFeedData(link);

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

async function processArticleChunks(
  articles: Parser.Item[],
  options: ProcessArticlesOptions = { chunkSize: 10, parallelDelay: 1000 }
): Promise<ArticleMetadata[]> {
  if (articles.length === 0) return [];
  const { chunkSize, parallelDelay } = options;
  const articleMetadata: ArticleMetadata[] = [];

  const chunks = Array.from({ length: Math.ceil(articles.length / chunkSize) }, (_, i) =>
    articles.slice(i * chunkSize, i * chunkSize + chunkSize)
  );

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (article) => {
        return await retrieveArticleMetadata(article);
      })
    );

    articleMetadata.push(
      ...chunkResults.filter((article): article is ArticleMetadata => Boolean(article))
    );

    await new Promise((resolve) => setTimeout(resolve, parallelDelay));
  }

  return articleMetadata;
}

async function retrieveArticlesMetadata(
  feed: Feed,
  jobContext: string = 'None'
): Promise<ArticleMetadata[]> {
  try {
    const orderedArticles = await retrieveArticlesFromFeed(feed.link);

    if (!orderedArticles) return [];

    console.info(`[${jobContext}] Syncing ${orderedArticles.length} articles from ${feed.name}...`);

    const articles = await processArticleChunks(orderedArticles);

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

async function retrieveArticleMetadata(article: Parser.Item): Promise<ArticleMetadata | undefined> {
  const { link, title } = article;
  const pubDate = article.pubDate ?? article.isoDate;

  if (!isValidLink(link)) {
    return undefined;
  }

  const siteName = new URL(link).hostname.replace('www.', '');

  const existingArticleMetadata = await retrieveCachedArticleMetadata(link);

  if (existingArticleMetadata) {
    return undefined;
  }

  console.info(`Processing article: ${link}`);

  const partialMetadata = await retrieveArticleMetadataDetails(link, title);

  const articleMetadata = {
    ...partialMetadata,
    title: title ?? partialMetadata?.title ?? 'Untitled',
    readable: partialMetadata?.readable ?? false,
    publishedAt: pubDate ? new Date(pubDate) : new Date(),
    link,
    siteName
  };
  await storeArticleMetadataInCache(link, articleMetadata);
  return articleMetadata;
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

async function retrieveArticleMetadataDetails(
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

    const readableArticle = await readableArticleService.retrieveReadableArticle(link);
    const readable = !!readableArticle;

    const metadata = await urlMetadata(link, {
      timeout: 10000,
      requestHeaders: {
        'User-Agent': ua
      }
    });

    if (readable) {
      await cacheService.createReadableArticleCache(link, readableArticle);
    }

    const articleMetadata = deriveArticleMetadata(metadata, new URL(link).hostname);

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

function deriveArticleMetadata(
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
        (checkIfNewsArticle(metadata.jsonld[0])
          ? metadata.jsonld[0].headline
          : metadata.jsonld.find(checkIfNewsArticle)?.headline)) ||
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
function checkIfNewsArticle(
  jsonldData: unknown
): jsonldData is { '@type': 'NewsArticle'; headline: string } {
  if (typeof jsonldData === 'object' && jsonldData !== null) {
    const data = jsonldData as { '@type'?: string; headline?: string };
    return data['@type'] === 'NewsArticle' && typeof data.headline === 'string';
  }
  return false;
}

async function retrieveCachedArticleMetadata(link: string): Promise<ArticleMetadata | null> {
  const redis = initializeRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    return null;
  }

  const cached = await redis.get(`article-metadata:${generateLinkHash(link)}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

async function storeArticleMetadataInCache(link: string, article: ArticleMetadata): Promise<void> {
  const redis = initializeRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    throw new Error('Link is required');
  }

  const expirationTime = 24 * 60 * 60; // 1 day
  await redis.set(
    `article-metadata:${generateLinkHash(link)}`,
    JSON.stringify(article),
    'EX',
    expirationTime
  );
}

async function removeArticleMetadataFromCache(link: string): Promise<void> {
  const redis = initializeRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    throw new Error('Link is required');
  }

  await redis.del(`article-metadata:${generateLinkHash(link)}`);
}

export default {
  retrieveArticlesMetadata,
  retrieveArticleMetadata,
  retrieveCachedArticleMetadata,
  storeArticleMetadataInCache,
  removeArticleMetadataFromCache,
  retrieveArticleMetadataDetails,
  deriveArticleMetadata,
  checkIfNewsArticle
};
