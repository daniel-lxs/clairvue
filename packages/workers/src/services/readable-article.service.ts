import { Redis } from 'ioredis';
import type { ReadableArticle } from '@clairvue/types';
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

// Readable article

async function cacheReadableArticle(link: string, article: ReadableArticle): Promise<void> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    throw new Error('Link is required');
  }

  const expirationTime = 24 * 60 * 60 * 2; // 2 days
  await redis.set(
    `readable-article:${hashLink(link)}`,
    JSON.stringify(article),
    'EXAT',
    expirationTime
  ); // 2 days
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

async function createReadableArticleCache(
  link: string,
  readableArticle: ReadableArticle
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    throw new Error('Link is required');
  }

  const expirationTime = 24 * 60 * 60 * 2; // 2 days
  await redis.set(
    `readable-article:${hashLink(link)}`,
    JSON.stringify(readableArticle),
    'EXAT',
    expirationTime
  );
}

async function fetchReadableArticle(link: string): Promise<ReadableArticle | undefined> {
  const redis = getRedisClient();
  if (!redis) return undefined;

  if (!link) {
    return undefined;
  }

  const cached = await redis.get(`readable-article:${hashLink(link)}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return undefined;
}

async function getUpdatedReadableArticle(link: string): Promise<ReadableArticle | undefined> {
  const redis = getRedisClient();
  if (!redis) return undefined;

  if (!link) {
    return undefined;
  }

  const cached = await redis.get(`readable-article:${hashLink(link)}`);
  if (cached) {
    const article: ReadableArticle = JSON.parse(cached);
    // Update logic here if needed
    return article;
  }
  return undefined;
}

export default {
  cacheReadableArticle,
  getCachedReadableArticle,
  doesReadableArticleExist,
  deleteReadableArticleCache,
  createReadableArticleCache,
  fetchReadableArticle,
  getUpdatedReadableArticle
};
