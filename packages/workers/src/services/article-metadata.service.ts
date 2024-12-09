import Parser from 'rss-parser';
import urlMetadata from 'url-metadata';
import config from '../config';
import feedService from './feed.service';
import { ArticleMetadata } from '@clairvue/types';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { isValidLink, normalizeError } from '../utils';
import { Result } from '@clairvue/types';
import { z } from 'zod';

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
  } catch (e) {
    const error = normalizeError(e);
    console.error(`Error ${error.message} occurred while parsing feed, trying to get feed URL`);

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
): Promise<Result<Partial<ArticleMetadata>, Error>> {
  const { link, title } = article;
  const pubDate = article.pubDate ?? article.isoDate;

  if (!isValidLink(link)) {
    return Result.err(new Error('Invalid link'));
  }

  const siteName = new URL(link).hostname.replace('www.', '');

  console.info(`Processing article: ${link}`);

  const partialMetadataResult = await retrieveArticleMetadataDetails(link, response);

  return partialMetadataResult.match({
    ok: async (partialMetadata) => {
      let articleMetadata: ArticleMetadata;
      if (!partialMetadata) {
        articleMetadata = {
          title: title ?? 'Untitled',
          readable,
          publishedAt: pubDate ? new Date(pubDate) : new Date(),
          link,
          siteName
        };
      } else {
        articleMetadata = {
          ...partialMetadata,
          title: title ?? partialMetadata?.title ?? 'Untitled',
          readable,
          publishedAt: pubDate ? new Date(pubDate) : new Date(),
          link,
          siteName
        };
      }

      await storeArticleMetadataInCache(link, articleMetadata);

      return Result.ok(articleMetadata);
    },
    err: (e) => {
      const error = normalizeError(e);
      console.error('Error occurred while retrieving article metadata:', error);
      return Result.err(error);
    }
  });
}

async function retrieveArticleMetadataDetails(
  link: string,
  response: Response
): Promise<Result<Partial<ArticleMetadata> | false, Error>> {
  try {
    const metadata = await urlMetadata(null, {
      parseResponseObject: response
    });

    return Result.ok(deriveArticleMetadata(metadata, new URL(link).hostname) ?? false);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while retrieving article metadata:', error);
    return Result.err(error);
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
  deriveArticleMetadata,
  checkIfNewsArticle
};
