import feedRepository from '@/server/data/repositories/feed.repository';
import DOMPurify from 'isomorphic-dompurify';
import type { CreateFeedDto } from '@/server/dto/feed.dto';
import { getArticlesQueue } from '@/server/queue/articles';
import collectionService from './collection.service';
import { JSDOM } from 'jsdom';
import { Result, type Feed, type FeedInfo } from '@clairvue/types';
import { normalizeError } from '$lib/utils';
import Parser from 'rss-parser';
import config from '../../config';
import { downloadFavicon } from './favicon.service';

async function findById(id: string): Promise<Result<Feed | false, Error>> {
  return await feedRepository.findById(id);
}

async function createFeed(feedData: CreateFeedDto, userId: string): Promise<Result<Feed, Error>> {
  try {
    const createdFeed = (
      await feedRepository.create({
        ...feedData,
        description: feedData.description ?? null,
        faviconPath: feedData.faviconPath ?? null
      })
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

async function extractFeedUrl(html: string, baseUrl: string): Promise<string | null> {
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

  let feedUrl: string | null = null;

  if (rssLinkElement) {
    const rssLink = rssLinkElement.getAttribute('href');
    if (rssLink) {
      feedUrl = !rssLink.startsWith('http') ? new URL(rssLink, baseUrl).toString() : rssLink;
    }
  }

  if (!feedUrl && atomLinkElement) {
    const atomLink = atomLinkElement.getAttribute('href');
    if (atomLink) {
      feedUrl = !atomLink.startsWith('http') ? new URL(atomLink, baseUrl).toString() : atomLink;
    }
  }

  return feedUrl;
}

async function fetchAndParseFeed(url: string): Promise<Result<FeedInfo, Error>> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': config.app.userAgent
      }
    });

    if (!response.ok) {
      return Result.err(new Error(`HTTP error! status: ${response.status}`));
    }

    const feedData = await response.text();
    try {
      const parsedData = await new Parser().parseString(feedData);

      if (!parsedData || !parsedData.title) {
        throw new Error('Invalid feed');
      }

      const { title, description } = parsedData;
      let faviconPath: string | undefined = undefined;

      // Try to get favicon from the feed's link property
      if (parsedData.link) {
        const downloadResult = await downloadFavicon(parsedData.link);
        if (downloadResult.isErr()) {
          return downloadResult;
        }
        faviconPath = downloadResult.unwrap();
      }

      // Determine feed type
      let feedType: 'rss' | 'atom' = 'rss';
      if (feedData.includes('<feed') && feedData.includes('xmlns="http://www.w3.org/2005/Atom"')) {
        feedType = 'atom';
      }

      return Result.ok({
        title,
        description,
        url,
        type: feedType,
        faviconPath
      });
    } catch (parseError) {
      // If parsing fails, try to find the feed URL in the HTML
      const feedUrl = await extractFeedUrl(feedData, url);

      // Try to get favicon from the original URL since this is likely a website
      let faviconPath: string | undefined = undefined;
      const downloadResult = await downloadFavicon(url);
      if (downloadResult.isErr()) {
        return downloadResult;
      }
      faviconPath = downloadResult.unwrap();

      if (!feedUrl) {
        return Result.err(new Error('No RSS or Atom feed found'));
      }

      // Try to fetch and parse the actual feed URL
      const feedResponse = await fetch(feedUrl, {
        headers: {
          'User-Agent': config.app.userAgent
        }
      });
      if (!feedResponse.ok) {
        return Result.err(new Error(`HTTP error! status: ${feedResponse.status}`));
      }

      const actualFeedData = await feedResponse.text();
      const parsedFeedData = await new Parser().parseString(actualFeedData);

      if (!parsedFeedData || !parsedFeedData.title) {
        return Result.err(new Error('Invalid feed'));
      }

      const { title, description } = parsedFeedData;

      // Determine feed type
      let feedType: 'rss' | 'atom' = 'rss';
      if (
        actualFeedData.includes('<feed') &&
        actualFeedData.includes('xmlns="http://www.w3.org/2005/Atom"')
      ) {
        feedType = 'atom';
      }

      return Result.ok({
        title,
        description,
        url: feedUrl,
        type: feedType,
        faviconPath
      });
    }
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while parsing feed:', error);
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

async function deleteForUser(userId: string, feedId: string): Promise<Result<true, Error>> {
  return await feedRepository.deleteForUser(userId, feedId);
}

async function findByLink(link: string): Promise<Result<Feed | false, Error>> {
  return await feedRepository.findByLink(link);
}

async function findDefaultFeedByUserId(userId: string): Promise<Result<Feed | false, Error>> {
  return await feedRepository.findDefaultFeedByUserId(userId);
}

export default {
  findById,
  findByUserId,
  findDefaultFeedByUserId,
  findByLink,
  createFeed,
  updateFeed,
  findBySlug,
  countArticles,
  fetchAndParseFeed,
  updateLastSyncedAt,
  deleteForUser
};
