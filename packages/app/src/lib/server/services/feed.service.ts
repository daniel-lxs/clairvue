import feedRepository from '@/server/data/repositories/feed.repository';
import DOMPurify from 'isomorphic-dompurify';
import type { CreateFeedDto } from '@/server/dto/feed.dto';
import { getArticlesQueue } from '@/server/queue/articles';
import collectionService from './collection.service';
import config from '@/config';
import { JSDOM } from 'jsdom';
import { Result, type Feed, type FeedWithArticles } from '@clairvue/types';
import { normalizeError } from '$lib/utils';
import Parser from 'rss-parser';

async function findById(id: string): Promise<Result<Feed | false, Error>> {
  return await feedRepository.findById(id);
}

async function createFeed(feedData: CreateFeedDto, userId: string): Promise<Result<Feed, Error>> {
  try {
    const createdFeed = (
      await feedRepository.create({ ...feedData, description: feedData.description ?? null })
    ).unwrap();

    if (feedData.collectionId) {
      await collectionService.addFeedToCollection(feedData.collectionId, createdFeed.id);
    }

    // Always add to the default collection
    if (!feedData.collectionId.includes('default')) {
      (await collectionService.findDefault(userId)).match({
        ok: (defaultCollection) => {
          if (!defaultCollection) {
            throw new Error('Default collection not found');
          }
          collectionService.addFeedToCollection(defaultCollection.id, createdFeed.id);
        },
        err: (error) => {
          console.error('Error occurred while finding default collection:', error);
          throw error;
        }
      });
    }

    if (!createdFeed.link.startsWith('default-feed')) {
      const articleQueue = getArticlesQueue();
      articleQueue?.add(
        'sync-articles',
        { feed: createdFeed },
        {
          deduplication: {
            id: createdFeed.id
          },
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        }
      );
    }

    return Result.ok(createdFeed);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while creating feed:', error);
    return Result.err(error);
  }
}

async function updateFeed(
  id: string,
  data: Pick<Feed, 'name' | 'link' | 'description'>
): Promise<Result<Feed, Error>> {
  return await feedRepository.update(id, data);
}

async function findBySlug(slug: string): Promise<Result<Feed | false, Error>> {
  return await feedRepository.findBySlug(slug);
}

async function countArticles(id: string): Promise<Result<number, Error>> {
  return await feedRepository.countArticles(id);
}

async function fetchAndParseFeed(
  url: string
): Promise<Result<{ title: string; description: string | undefined }, Error>> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return Result.err(new Error(`HTTP error! status: ${response.status}`));
    }

    const feedData = await response.text();
    const parsedData = await new Parser().parseString(feedData);

    if (!parsedData || !parsedData.title) {
      return Result.err(new Error('Invalid feed'));
    }

    const { title, description } = parsedData;

    return Result.ok({
      title,
      description
    });
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while parsing feed:', error);
    return Result.err(error);
  }
}

async function extractFeedUrl(url: string): Promise<Result<string, Error>> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': config.app.userAgent
      }
    });

    if (!response.ok) {
      return Result.err(new Error(`HTTP error! status: ${response.status}`));
    }

    const html = await response.text();

    const cleanHtml = DOMPurify.sanitize(html, {
      WHOLE_DOCUMENT: true,
      ALLOWED_TAGS: ['head', 'link']
    });

    const { document } = new JSDOM(cleanHtml).window;

    const rssLinkElement = document.querySelector(
      'link[rel="alternate"][type="application/rss+xml"]'
    );
    const atomLinkElement = document.querySelector(
      'link[rel="alternate"][type="application/atom+xml"]'
    );

    if (rssLinkElement) {
      const rssLink = rssLinkElement.getAttribute('href');
      if (rssLink) {
        if (!rssLink.startsWith('http')) {
          return Result.ok(new URL(rssLink, url).toString());
        }
        return Result.ok(rssLink);
      }
    }

    if (atomLinkElement) {
      const atomLink = atomLinkElement.getAttribute('href');
      if (atomLink) {
        if (!atomLink.startsWith('http')) {
          return Result.ok(new URL(atomLink, url).toString());
        }
        return Result.ok(atomLink);
      }
    }

    return Result.err(new Error('No RSS or Atom link found'));
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding feed link:', error);
    return Result.err(error);
  }
}

async function updateLastSyncedAt(id: string): Promise<void> {
  await feedRepository.updateLastSync(id);
}

async function findByUserId(
  userId: string,
  take?: number,
  skip?: number
): Promise<Result<Feed[] | false, Error>> {
  return await feedRepository.findByUserId(userId, take, skip);
}

async function findByCollectionIdWithArticles(
  collectionId: string,
  beforePublishedAt: Date,
  take?: number
): Promise<Result<FeedWithArticles[] | false, Error>> {
  return await feedRepository.findByCollectionIdWithArticles(collectionId, beforePublishedAt, take);
}

async function deleteForUser(userId: string, feedId: string): Promise<Result<true, Error>> {
  return await feedRepository.deleteForUser(userId, feedId);
}

export default {
  findById,
  findByUserId,
  findByCollectionIdWithArticles,
  createFeed,
  updateFeed,
  findBySlug,
  countArticles,
  extractFeedUrl,
  fetchAndParseFeed,
  updateLastSyncedAt,
  deleteForUser
};
