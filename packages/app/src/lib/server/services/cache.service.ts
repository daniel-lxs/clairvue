import { Redis } from 'ioredis';
import config from '@/config';
import type { ReadableArticle } from '@clairvue/types';
import { getQueueEvents, getUpdatedArticleQueue } from '../queue/articles';
import { createHash } from 'crypto';

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
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password
    });
  }

  return redisClient;
}

async function getCachedReadableArticle(link: string): Promise<ReadableArticle | undefined> {
  const redis = getRedisClient();
  if (!redis) return undefined;

  const cached = await redis.get(`readable-article:${hashLink(link)}`);
  if (cached) {
    return JSON.parse(cached);
  }

  return undefined;
}

async function getUpdatedReadableArticle(
  slug: string,
  link: string
): Promise<ReadableArticle | undefined> {
  const queueName = 'get-updated-article';

  const job = await getUpdatedArticleQueue().add(
    queueName,
    { slug, url: link },
    {
      deduplication: {
        id: slug
      }
    }
  );

  if (!job || !job.id) {
    return undefined;
  }

  const ttl = 1000 * 60 * 1; // 1 minute

  try {
    return await job.waitUntilFinished(getQueueEvents(queueName), ttl);
  } catch (error) {
    return undefined;
  }
}

export default {
  getCachedReadableArticle,
  getUpdatedReadableArticle
};
