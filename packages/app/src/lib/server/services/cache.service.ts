import { Redis } from 'ioredis';
import config from '@/config';
import { Result, type ReadableArticle } from '@clairvue/types';
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
  const queueName = 'get-updated-article';

  const job = await getUpdatedArticleQueue().add(
    queueName,
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
    return await job.waitUntilFinished(getQueueEvents(queueName), promiseTtl);
  } catch (error) {
    return Result.err(error as Error);
  }
}

export default {
  getCachedReadableArticle,
  getUpdatedReadableArticle
};
