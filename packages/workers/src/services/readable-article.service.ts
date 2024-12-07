import { Redis } from 'ioredis';
import { type ReadableArticle, Result } from '@clairvue/types';
import config from '../config';
import { createHash } from 'crypto';
import { isValidLink, normalizeError } from '../utils';
import DOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';
import { isProbablyReaderable, Readability } from '@mozilla/readability';

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

async function doesReadableArticleExist(link: string): Promise<Result<boolean, Error>> {
  const redis = getRedisClient();
  if (!redis) return Result.err(new Error('Redis client not initialized'));

  return Result.ok((await redis.exists(`readable-article:${hashLink(link)}`)) > 0);
}

async function getCachedReadableArticle(
  link: string
): Promise<Result<ReadableArticle | false, Error>> {
  const redis = getRedisClient();
  if (!redis) return Result.err(new Error('Redis client not initialized'));

  try {
    const cached = await redis.get(`readable-article:${hashLink(link)}`);
    if (cached) {
      return Result.ok(JSON.parse(cached));
    }
    return Result.ok(false);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while retrieving readable article from cache:', error);
    return Result.err(error);
  }
}

async function deleteReadableArticleCache(link: string): Promise<Result<true, Error>> {
  const redis = getRedisClient();
  if (!redis) return Result.err(new Error('Redis client not initialized'));

  try {
    await redis.del(`readable-article:${hashLink(link)}`);
    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while deleting readable article from cache:', error);
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

async function retrieveReadableArticle(
  link: string,
  response: Response
): Promise<Result<ReadableArticle | false, Error>> {
  if (!isValidLink(link)) {
    return Result.err(new Error('Invalid link'));
  }

  const documentResult = await extractAndSanitizeDocument(link, response);

  if (documentResult.isErr()) {
    return Result.err(documentResult.unwrapErr());
  }

  const document = documentResult.unwrap();

  try {
    if (isProbablyReaderable(document)) {
      // Modify image paths to absolute URLs
      const images = document.querySelectorAll('img');
      images.forEach((imgElement) => {
        const imgSrc = imgElement.getAttribute('src');
        if (imgSrc && !imgSrc.startsWith('http')) {
          // Convert relative image path to absolute URL
          const absoluteUrl = new URL(imgSrc, link).href;
          imgElement.setAttribute('src', absoluteUrl);
        }
      });

      // Parse the modified HTML using Readability
      const parsedArticle = new Readability(document).parse();
      if (!parsedArticle) {
        return Result.err(new Error('Failed to parse article'));
      }

      // Hash the content to check for updates
      const hash = createHash('sha256').update(parsedArticle.textContent).digest('hex');
      const readableArticle: ReadableArticle = {
        ...parsedArticle,
        contentHash: hash
      };

      return Result.ok(readableArticle);
    }
    return Result.ok(false);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while retrieving readable article:', error);
    return Result.err(error);
  }
}

async function extractAndSanitizeDocument(
  link: string,
  response: Response
): Promise<Result<Document, Error>> {
  try {
    const html = await response.text();
    const cleanHtml = DOMPurify.sanitize(html, {
      FORBID_TAGS: ['script', 'style', 'title', 'noscript', 'iframe'],
      FORBID_ATTR: ['style', 'class']
    });
    const dom = new JSDOM(cleanHtml, { url: link });
    return Result.ok(dom.window.document);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while extracting and sanitizing document:', error);
    return Result.err(error);
  }
}

async function refreshReadableArticle(
  link: string,
  response: Response
): Promise<Result<ReadableArticle | false, Error>> {
  const existingArticleResult = await getCachedReadableArticle(link);

  if (existingArticleResult.isErr()) {
    return Result.err(existingArticleResult.unwrapErr());
  }

  const result = await retrieveReadableArticle(link, response);

  return result.match({
    ok: async (readableArticle) => {
      if (!readableArticle) {
        return Result.err(new Error('Readable article not found'));
      }
      const existingReadableArticle = existingArticleResult.unwrap();
      const newHash = createHash('sha256').update(readableArticle.textContent).digest('hex');
      if (existingReadableArticle && existingReadableArticle.contentHash === newHash) {
        return Result.ok(false);
      }
      await createReadableArticleCache(link, readableArticle);
      return Result.ok(readableArticle);
    },
    err: (error) => Result.err(error)
  });
}

export default {
  getCachedReadableArticle,
  doesReadableArticleExist,
  deleteReadableArticleCache,
  createReadableArticleCache,
  refreshReadableArticle,
  retrieveReadableArticle
};
