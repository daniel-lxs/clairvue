import { Redis } from 'ioredis';
import type { ArticleMetadata, ReadableArticle } from '@clairvue/types';
import config from '../config';
import { createHash } from 'crypto';

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

// Article metadata

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

  await redis.set(
    `article-metadata:${hashLink(link)}`,
    JSON.stringify(article),
    'EXAT',
    new Date().getTime() + 24 * 60 * 60
  ); // 1 day
}

async function deleteArticleMetadataCache(link: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    throw new Error('Link is required');
  }

  await redis.del(`article-metadata:${hashLink(link)}`);
}

// Readable article

async function cacheReadableArticle(link: string, article: ReadableArticle): Promise<void> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    throw new Error('Link is required');
  }

  await redis.set(`readable-article:${hashLink(link)}`, JSON.stringify(article));
}

async function doesReadableArticleExist(link: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    throw new Error('Link is required');
  }

  return (await redis.exists(`readable-article:${hashLink(link)}`)) > 0;
}

async function getCachedReadableArticle(link: string): Promise<ReadableArticle | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  if (!link) {
    return null;
  }

  const cached = await redis.get(`readable-article:${hashLink(link)}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

async function deleteReadableArticleCache(link: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    throw new Error('Link is required');
  }

  await redis.del(`readable-article:${hashLink(link)}`);
}

export default {
  getCachedArticleMetadata,
  cacheArticleMetadata,
  deleteArticleMetadataCache,
  cacheReadableArticle,
  getCachedReadableArticle,
  doesReadableArticleExist,
  deleteReadableArticleCache
};
