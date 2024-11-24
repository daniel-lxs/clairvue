import { Redis } from 'ioredis';
import type { ParsedArticle } from '@/types/ParsedArticle';
import config from '@/config';

// Check if we're in a server environment
const isServer = typeof process !== 'undefined' && config.redis.host && config.redis.port;

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!isServer) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password
    });
  }

  return redisClient;
}

const CACHE_TTL = Number(config.app.articleCacheTTL || 3600); // Default 1 hour

export async function getCachedArticle(slug: string): Promise<ParsedArticle | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const cached = await redis.get(`article:${slug}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

export async function cacheArticle(slug: string, article: ParsedArticle): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  await redis.set(`article:${slug}`, JSON.stringify(article), 'EX', CACHE_TTL);
}

export async function invalidateArticleCache(slug: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  await redis.del(`article:${slug}`);
}
