import { Redis } from 'ioredis';
import type { ParsedArticle } from '@/types/ParsedArticle';

const redis = new Redis({
  host: process.env.PRIVATE_REDIS_HOST,
  port: Number(process.env.PRIVATE_REDIS_PORT),
  password: process.env.REDIS_PASSWORD
});

const CACHE_TTL = Number(process.env.ARTICLE_CACHE_TTL || 3600); // Default 1 hour

export async function getCachedArticle(slug: string): Promise<ParsedArticle | null> {
  const cached = await redis.get(`article:${slug}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

export async function cacheArticle(slug: string, article: ParsedArticle): Promise<void> {
  await redis.set(
    `article:${slug}`,
    JSON.stringify(article),
    'EX',
    CACHE_TTL
  );
}

export async function invalidateArticleCache(slug: string): Promise<void> {
  await redis.del(`article:${slug}`);
}
