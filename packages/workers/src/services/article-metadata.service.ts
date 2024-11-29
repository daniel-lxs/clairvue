import Parser from 'rss-parser';
import { z } from 'zod';
import urlMetadata from 'url-metadata';
import config from '../config';
import feedService from './feed.service';
import { ArticleMetadata } from '@clairvue/types';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { isValidLink } from '../utils';

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

async function retrieveArticleMetadata(
  response: Response,
  article: Parser.Item,
  readable: boolean = false
): Promise<ArticleMetadata | undefined> {
  const { link, title } = article;
  const pubDate = article.pubDate ?? article.isoDate;

  if (!isValidLink(link)) {
    return undefined;
  }

  const siteName = new URL(link).hostname.replace('www.', '');

  console.info(`Processing article: ${link}`);

  const partialMetadata = await retrieveArticleMetadataDetails(link, response, title);

  const articleMetadata = {
    ...partialMetadata,
    title: title ?? partialMetadata?.title ?? 'Untitled',
    readable,
    publishedAt: pubDate ? new Date(pubDate) : new Date(),
    link,
    siteName
  };
  await storeArticleMetadataInCache(link, articleMetadata);
  return articleMetadata;
}

async function retrieveArticleMetadataDetails(
  link: string,
  response: Response,
  title?: string
): Promise<Partial<ArticleMetadata> | undefined> {
  try {
    const metadata = await urlMetadata(null, {
      parseResponseObject: response
    });

    return deriveArticleMetadata(metadata, new URL(link).hostname);
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
  retrieveArticleMetadata,
  retrieveCachedArticleMetadata,
  retrieveArticlesFromFeed,
  storeArticleMetadataInCache,
  removeArticleMetadataFromCache,
  retrieveArticleMetadataDetails,
  deriveArticleMetadata,
  checkIfNewsArticle
};
