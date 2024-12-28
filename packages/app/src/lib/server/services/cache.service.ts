import { Redis } from 'ioredis';
import config from '@/config';
import { Result, type ArticleMetadata, type ReadableArticle } from '@clairvue/types';
import { getQueueEvents, getUpdatedArticleQueue } from '../queue/articles';
import { createHash } from 'crypto';
import { normalizeError } from '../../utils';

// Check if we're in a server environment
const isServer = typeof process !== 'undefined' && config.redis.host && config.redis.port;

let redisClient: Redis | null = null;

function hashLink(link: string): string {
  const hash = createHash('sha256').update(link).digest('hex');
  return hash.substring(0, 16);
}

function getRedisClient(): Redis | null {
  if (!isServer) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(config.redis);
  }

  return redisClient;
}

async function getCachedReadableArticle(
  link: string
): Promise<Result<ReadableArticle | false, Error>> {
  const redis = getRedisClient();
  if (!redis) return Result.err(new Error('Redis client not initialized'));

  const cached = await redis.get(`readable-article:${hashLink(link)}`);
  if (cached) {
    return Result.ok(JSON.parse(cached));
  }

  return Result.ok(false);
}

async function getUpdatedReadableArticle(
  slug: string,
  link: string
): Promise<Result<ReadableArticle | false, Error>> {
  const promiseTtl = 1000 * 60 * 1; // 1 minute
  const queue = getUpdatedArticleQueue();
  const job = await queue.add(
    queue.name,
    { slug, url: link },
    {
      deduplication: {
        id: slug
      },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    }
  );

  if (!job || !job.id) {
    return Result.ok(false);
  }

  try {
    const jobResult = await job.waitUntilFinished(getQueueEvents(queue.name), promiseTtl);

    // Check if we got a valid result from the job
    if (!jobResult) {
      return Result.ok(false);
    }

    // Get the current cached article to compare content
    const currentCachedResult = await getCachedReadableArticle(link);
    if (currentCachedResult.isErr()) {
      return Result.err(currentCachedResult.unwrapErr());
    }

    const updateResult = await updateReadableArticleUpdatedAt(link, new Date().toISOString());
    if (updateResult.isErr()) {
      return Result.err(updateResult.unwrapErr());
    }

    const currentCached = currentCachedResult.unwrap();

    // If we have a current cached version, compare the content hashes
    if (currentCached && currentCached.contentHash === jobResult.contentHash) {
      console.info(`No changes detected for article ${slug}`);
      return Result.ok(false);
    }

    // Cache the new version
    const cacheResult = await createReadableArticleCache(link, jobResult);
    if (cacheResult.isErr()) {
      return Result.err(cacheResult.unwrapErr());
    }

    return Result.ok(jobResult);
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('Error getting updated article:', normalizedError);
    return Result.err(normalizedError);
  }
}

async function storeArticleMetadataInCache(
  link: string,
  article: ArticleMetadata
): Promise<Result<true, Error>> {
  const redis = getRedisClient();
  if (!redis) return Result.err(new Error('Redis client not initialized'));

  if (!link) {
    return Result.err(new Error('Link is required'));
  }

  const expirationTime = 24 * 60 * 60; // 1 day

  try {
    await redis.set(
      `article-metadata:${hashLink(link)}`,
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

async function createReadableArticleCache(
  link: string,
  readableArticle: ReadableArticle
): Promise<Result<true, Error>> {
  const redis = getRedisClient();
  if (!redis) return Result.err(new Error('Redis client not initialized'));

  const expirationTime = 24 * 60 * 60 * 2; // 2 days

  try {
    // Set updatedAt to the same value as createdAt
    readableArticle.updatedAt = readableArticle.createdAt;

    await redis.set(
      `readable-article:${hashLink(link)}`,
      JSON.stringify(readableArticle),
      'EX',
      expirationTime
    );
    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while storing readable article in cache:', error);
    return Result.err(error);
  }
}

async function updateReadableArticleUpdatedAt(
  link: string,
  newUpdatedAt: string
): Promise<Result<true, Error>> {
  const redis = getRedisClient();
  if (!redis) return Result.err(new Error('Redis client not initialized'));

  try {
    // Get the existing cached article
    const cachedArticleResult = await getCachedReadableArticle(link);
    if (cachedArticleResult.isErr()) {
      return Result.err(cachedArticleResult.unwrapErr());
    }

    const cachedArticle = cachedArticleResult.unwrap();

    // If no cached article exists, return an error
    if (!cachedArticle) {
      return Result.err(new Error('Readable article not found in cache'));
    }

    // Update the updatedAt property
    cachedArticle.updatedAt = newUpdatedAt;

    // Re-cache the updated article
    await redis.set(
      `readable-article:${hashLink(link)}`,
      JSON.stringify(cachedArticle),
      'KEEPTTL' // Keep the existing expiration time
    );

    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while updating readable article updatedAt:', error);
    return Result.err(error);
  }
}

async function getArticleMetadataFromCache(
  link: string
): Promise<Result<ArticleMetadata | false, Error>> {
  const redis = getRedisClient();
  if (!redis) return Result.err(new Error('Redis client not initialized'));

  try {
    const cached = await redis.get(`article-metadata:${hashLink(link)}`);
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

export default {
  getCachedReadableArticle,
  getUpdatedReadableArticle,
  getArticleMetadataFromCache,
  storeArticleMetadataInCache,
  createReadableArticleCache,
  updateReadableArticleUpdatedAt
};
