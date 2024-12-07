import Parser from 'rss-parser';
import urlMetadata from 'url-metadata';
import config from '../config';
import feedService from './feed.service';
import { ArticleMetadata } from '@clairvue/types';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { isValidLink, normalizeError } from '../utils';
import { Result } from '@clairvue/types';

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

async function retrieveFeedData(url: string): Promise<Result<Parser.Output<Parser.Item>, Error>> {
  const parser = new Parser({
    timeout: 40000, // 40 seconds
    headers: {
      'User-Agent': config.app.userAgent
    }
  });

  try {
    return Result.ok(await parser.parseURL(url));
  } catch (error) {
    console.error(
      `Feed with url: ${url} could not be parsed, trying to find RSS or Atom feed link`,
      error
    );

    const urlResult = await feedService.tryGetFeedUrl(url);

    return urlResult.match({
      ok: async (feedUrl) => {
        if (feedUrl === url) {
          return Result.err(new Error('Feed URL is the same as the original URL'));
        }
        try {
          return Result.ok(await parser.parseURL(feedUrl));
        } catch (parseError) {
          return Result.err(new Error(`Failed to parse feed from ${feedUrl}: ${parseError}`));
        }
      },
      err: (error) => Result.err(error)
    });
  }
}

async function retrieveArticlesFromFeed(link: string): Promise<Result<Parser.Item[], Error>> {
  const feedResult = await retrieveFeedData(link);

  return feedResult.match({
    ok: (feed) => {
      if (!feed || !feed.items || feed.items.length === 0) {
        return Result.err(new Error('No items found in feed'));
      }

      feed.items.sort((a, b) => {
        if (a.pubDate && b.pubDate) {
          return new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf();
        } else {
          return 0; // Or handle the case where pubDate is undefined
        }
      });

      return Result.ok(feed.items);
    },
    err: (e) => {
      const error = normalizeError(e);
      console.error('Error occurred while retrieving articles from feed:', error);
      return Result.err(error);
    }
  });
}

async function retrieveArticleMetadata(
  response: Response,
  article: Parser.Item,
  readable: boolean = false
): Promise<Result<ArticleMetadata, Error>> {
  const { link, title } = article;
  const pubDate = article.pubDate ?? article.isoDate;

  if (!isValidLink(link)) {
    return Result.err(new Error('Invalid link'));
  }

  const siteName = new URL(link).hostname.replace('www.', '');

  console.info(`Processing article: ${link}`);

  const metadataResult = await retrieveArticleMetadataDetails(link, response);

  return metadataResult.match({
    ok: async (partialMetadata) => {
      const metadata = {
        ...partialMetadata,
        title: title ?? partialMetadata.title ?? 'Untitled',
        readable,
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
        link,
        siteName
      };
      await storeArticleMetadataInCache(link, metadata);
      return Result.ok(metadata);
    },
    err: (e) => {
      console.error('Error occurred while retrieving article metadata:', e);
      return Result.err(e);
    }
  });
}

async function retrieveArticleMetadataDetails(
  link: string,
  response: Response
): Promise<Result<Partial<ArticleMetadata>, Error>> {
  try {
    const metadata = await urlMetadata(null, {
      parseResponseObject: response
    });

    if (!metadata) {
      return Result.err(new Error('Metadata not found'));
    }

    return deriveArticleMetadata(metadata, new URL(link).hostname);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while retrieving article metadata:', error);
    return Result.err(error);
  }
}

function extractMetadataValue(
  metadata: urlMetadata.Result,
  primaryKey: string,
  alternateKeys: string[] = [],
  transformer?: (value: any) => string | undefined
): string | undefined {
  const possibleValues = [metadata[primaryKey], ...alternateKeys.map((key) => metadata[key])];

  const value = possibleValues.find((v) => typeof v === 'string');
  return transformer ? transformer(value) : value;
}

function extractJsonLdValue(
  jsonld: any,
  primaryPath: (string | number)[],
  fallbackPaths: (string | number)[][] = []
): string | undefined {
  if (Array.isArray(jsonld)) {
    const primaryMatch = jsonld.find((item) => primaryPath.every((path) => path in item));

    if (primaryMatch) {
      return primaryPath.reduce((obj, key) => obj?.[key], primaryMatch);
    }

    for (const fallbackPath of fallbackPaths) {
      const fallbackMatch = jsonld.find((item) => fallbackPath.every((path) => path in item));

      if (fallbackMatch) {
        return fallbackPath.reduce((obj, key) => obj?.[key], fallbackMatch);
      }
    }
  }

  return undefined;
}

function normalizeUrl(url: string | undefined, domain: string): string | undefined {
  if (!url) return undefined;

  try {
    if (!url.startsWith('http')) {
      url = new URL(url, `https://${domain}`).href;
    }

    if (url.includes(',')) {
      url = url.split(',')[0].trim();
    }

    new URL(url);
    return url;
  } catch {
    return undefined;
  }
}

function deriveArticleMetadata(
  metadata: urlMetadata.Result,
  domain: string,
  logger?: (message: string) => void
): Result<Partial<ArticleMetadata>, Error> {
  logger?.(`Extracting metadata for domain: ${domain}`);

  const title =
    extractMetadataValue(metadata, 'title', ['og:title', 'twitter:title']) ||
    extractJsonLdValue(metadata.jsonld, ['headline'], [['name'], ['title']]) ||
    metadata.headings?.find((h: { level: string }) => h.level === 'h1')?.text;

  const author =
    extractMetadataValue(metadata, 'author', ['og:author', 'twitter:creator']) ||
    extractJsonLdValue(
      metadata.jsonld,
      ['author', 'name'],
      [
        ['author', 0, 'name'],
        ['publisher', 'name']
      ]
    );

  const description =
    extractMetadataValue(metadata, 'description', ['og:description', 'twitter:description']) ||
    extractJsonLdValue(metadata.jsonld, ['description'], [['abstract']]);

  const image = normalizeUrl(
    extractMetadataValue(metadata, 'image', [
      'og:image',
      'twitter:image',
      'twitter:image:src',
      'og:image:secure_url'
    ]) || extractJsonLdValue(metadata.jsonld, ['image', 'url'], [['image', 0, 'url']]),
    domain
  );

  return Result.ok({
    title,
    description,
    image,
    author,
    readable: false
  });
}

async function retrieveCachedArticleMetadata(
  link: string
): Promise<Result<ArticleMetadata | false, Error>> {
  const redis = initializeRedisClient();
  if (!redis) return Result.err(new Error('Redis client not initialized'));

  try {
    const cached = await redis.get(`article-metadata:${generateLinkHash(link)}`);
    if (cached) {
      return Result.ok(JSON.parse(cached));
    }
    return Result.ok(false);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while retrieving article metadata from cache:', error);
    return Result.err(error);
  }
}

async function storeArticleMetadataInCache(
  link: string,
  article: ArticleMetadata
): Promise<Result<true, Error>> {
  const redis = initializeRedisClient();
  if (!redis) return Result.err(new Error('Redis client not initialized'));

  if (!link) {
    return Result.err(new Error('Link is required'));
  }

  const expirationTime = 24 * 60 * 60; // 1 day

  try {
    await redis.set(
      `article-metadata:${generateLinkHash(link)}`,
      JSON.stringify(article),
      'EX',
      expirationTime
    );

    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while storing article metadata in cache:', error);
    return Result.err(error);
  }
}

async function removeArticleMetadataFromCache(link: string): Promise<Result<true, Error>> {
  const redis = initializeRedisClient();
  if (!redis) return Result.err(new Error('Redis client not initialized'));

  try {
    await redis.del(`article-metadata:${generateLinkHash(link)}`);
    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while removing article metadata from cache:', error);
    return Result.err(error);
  }
}

export default {
  retrieveArticleMetadata,
  retrieveCachedArticleMetadata,
  retrieveArticlesFromFeed,
  storeArticleMetadataInCache,
  removeArticleMetadataFromCache,
  retrieveArticleMetadataDetails,
  deriveArticleMetadata
};
