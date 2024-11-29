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

async function retrieveReadableArticle(link: string): Promise<ReadableArticle | undefined> {
  if (!isValidLink(link)) {
    return undefined;
  }

  const document = await retrieveAndSanitizeDocument(link, config.app.userAgent);

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

async function retrieveAndSanitizeDocument(
  link: string,
  ua?: string | null
): Promise<Document | undefined> {
  const userAgent = ua || config.app.userAgent;
  const timeout = 20000; // 20 seconds

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`Timeout reached while fetching article with link ${link}`);
    }, timeout);

    const pageResponse = await fetch(link, {
      headers: { 'User-Agent': userAgent },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!pageResponse.ok) {
      console.error(
        `Error occurred while fetching article with link ${link}: ${pageResponse.statusText}`
      );
      return undefined;
    }

    const html = await pageResponse.text();
    const cleanHtml = DOMPurify.sanitize(html, {
      FORBID_TAGS: ['script', 'style', 'title', 'noscript', 'iframe'],
      FORBID_ATTR: ['style', 'class']
    });
    const dom = new JSDOM(cleanHtml, { url: link });
    return dom.window.document;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`Timeout reached while fetching article with link ${link}`);
      } else {
        console.error(`Error occurred while fetching article: ${error}`);
      }
    } else {
      console.error(`Unknown error occurred while fetching article ${error}`);
    }
    return undefined;
  }
}

async function getUpdatedReadableArticle(link: string): Promise<ReadableArticle | undefined> {
  const existingReadableArticle = await getCachedReadableArticle(link);

  const readableArticle = await retrieveReadableArticle(link);

  if (!readableArticle) {
    return undefined;
  }

  const newHash = createHash('sha256').update(readableArticle.textContent).digest('hex');
  console.log(`Compared article hash ${existingReadableArticle?.contentHash} with ${newHash}`);
  if (existingReadableArticle && existingReadableArticle.contentHash === newHash) {
    return undefined;
  }
  console.log(`Updated readable article for link ${link}`);
  await createReadableArticleCache(link, readableArticle);

  return readableArticle;
}

async function refreshReadableArticle(link: string): Promise<ReadableArticle | undefined> {
  const existingReadableArticle = await getCachedReadableArticle(link);

  const readableArticle = await retrieveReadableArticle(link);

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
  getUpdatedReadableArticle,
  retrieveReadableArticle,
  refreshReadableArticle
};
