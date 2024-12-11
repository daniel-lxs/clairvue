import type { CreateFeedDto } from '@/server/dto/feed.dto';
import type { FeedInfo } from '@clairvue/types';
import { Result } from '@clairvue/types';
import type { Feed } from '@/server/data/schema';
import { normalizeError } from '$lib/utils';

async function createFeeds(feeds: CreateFeedDto[]): Promise<Result<Feed[], Error>> {
  try {
    const response = await fetch('/api/feed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feeds)
    });

    if (!response.ok) {
      return Result.err(new Error(`Failed to create feeds: ${response.statusText}`));
    }

    const results: Feed[] = await response.json();
    if (results.length !== feeds.length) {
      return Result.err(new Error('Failed to create all feeds'));
    }

    return Result.ok(results);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while creating feeds:', error);
    return Result.err(error);
  }
}

async function getFeedInfo(link: string): Promise<Result<FeedInfo, Error>> {
  try {
    const response = await fetch(`/api/feedInfo?link=${btoa(link)}`);

    if (!response.ok) {
      return Result.err(new Error(response.statusText));
    }

    return Result.ok(await response.json());
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting feed info:', error);
    return Result.err(error);
  }
}

async function getFeedBySlug(slug: string): Promise<Result<Feed, Error>> {
  try {
    const response = await fetch(`/api/feed?slug=${slug}`);
    if (!response.ok) {
      return Result.err(new Error(`Failed to get feed: ${response.statusText}`));
    }
    return Result.ok(await response.json());
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting feed:', error);
    return Result.err(error);
  }
}

async function updateFeed(
  id: string,
  name: string,
  description: string,
  link: string,
  collectionId: string
): Promise<Result<Feed, Error>> {
  try {
    const response = await fetch('/api/feed', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: id,
        name: name,
        description: description,
        link: link,
        collectionId
      })
    });

    if (!response.ok) {
      console.error(`Failed to update feed: ${response.statusText}`);
      throw new Error('Failed to update feed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error occurred while updating feed:', error);
    throw error;
  }
}

async function getFeeds(take: number = 10, skip: number = 0): Promise<Result<Feed[], Error>> {
  try {
    const response = await fetch(`/api/feeds?&take=${take}&skip=${skip}`);
    if (!response.ok) {
      return Result.err(new Error(`Failed to get feeds: ${response.statusText}`));
    }
    return Result.ok(await response.json());
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting feeds:', error);
    return Result.err(error);
  }
}

async function deleteFeed(feedId: string): Promise<Result<true, Error>> {
  try {
    const response = await fetch(`/api/feed?feedId=${feedId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      return Result.err(new Error(`Failed to delete feed: ${response.statusText}`));
    }

    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while deleting feed:', error);
    return Result.err(error);
  }
}

export default {
  createFeeds,
  getFeedInfo,
  getFeedBySlug,
  updateFeed,
  getFeeds,
  deleteFeed
};
