import { Redis } from 'ioredis';
import config from '@/config';
import type { ReadableArticle } from '@clairvue/types';
import { getQueueEvents, getUpdatedArticleQueue } from '../queue/articles';

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

async function getCachedReadableArticle(slug: string): Promise<ReadableArticle | undefined> {
  const redis = getRedisClient();
  if (!redis) return undefined;

  const cached = await redis.get(`article:${slug}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return undefined;
}

async function getUpdatedReadableArticle(
  slug: string,
  link: string
): Promise<ReadableArticle | string> {
  const queueName = 'get-updated-article';

  const job = await getUpdatedArticleQueue().add(queueName, { slug, url: link });

  const ttl = 1000 * 60 * 1; // 1 minute

  return job.waitUntilFinished(getQueueEvents(queueName), ttl);
}

export default {
  getCachedReadableArticle,
  getUpdatedReadableArticle
};
