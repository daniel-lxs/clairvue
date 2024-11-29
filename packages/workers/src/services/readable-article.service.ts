import { Redis } from 'ioredis';
import type { ReadableArticle } from '@clairvue/types';
import config from '../config';
import { createHash } from 'crypto';
import { isValidLink } from '../utils';
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

async function doesReadableArticleExist(link: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Redis client not initialized');

  if (!link) {
    throw new Error('Link is required');
  }

  return (await redis.exists(`readable-article:${hashLink(link)}`)) > 0;
}

async function getCachedReadableArticle(link: string): Promise<ReadableArticle | undefined> {
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
    'EX',
    expirationTime
  );
}

async function retrieveReadableArticle(
  link: string,
  response: Response
): Promise<ReadableArticle | undefined> {
  if (!isValidLink(link)) {
    return undefined;
  }

  const document = await extractAndSanitizeDocument(link, response);

  if (!document) {
    return undefined;
  }

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
      console.error('Error occurred while parsing article');
      return undefined;
    }

    // Hash the content to check for updates
    const hash = createHash('sha256').update(parsedArticle.textContent).digest('hex');
    const readableArticle: ReadableArticle = {
      ...parsedArticle,
      contentHash: hash
    };

    return readableArticle;
  }

  return undefined;
}

async function extractAndSanitizeDocument(
  link: string,
  response: Response
): Promise<Document | undefined> {
  try {
    const html = await response.text();
    const cleanHtml = DOMPurify.sanitize(html, {
      FORBID_TAGS: ['script', 'style', 'title', 'noscript', 'iframe'],
      FORBID_ATTR: ['style', 'class']
    });
    const dom = new JSDOM(cleanHtml, { url: link });
    return dom.window.document;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error occurred while extracting document: ${error}`);
    } else {
      console.error(`Unknown error occurred while extracting document ${error}`);
    }
    return undefined;
  }
}

async function refreshReadableArticle(
  link: string,
  response: Response
): Promise<ReadableArticle | undefined> {
  const existingReadableArticle = await getCachedReadableArticle(link);

  const readableArticle = await retrieveReadableArticle(link, response);

  if (!readableArticle) {
    return undefined;
  }

  const newHash = createHash('sha256').update(readableArticle.textContent).digest('hex');
  if (existingReadableArticle && existingReadableArticle.contentHash === newHash) {
    return undefined;
  }
  await createReadableArticleCache(link, readableArticle);

  return readableArticle;
}

export default {
  getCachedReadableArticle,
  doesReadableArticleExist,
  deleteReadableArticleCache,
  createReadableArticleCache,
  refreshReadableArticle,
  retrieveReadableArticle
};
