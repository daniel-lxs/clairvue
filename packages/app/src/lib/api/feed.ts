import type { CreateFeedDto } from '@/server/dto/feed.dto';
import type { CreateFeedResult } from '@clairvue/types';
import type { Feed } from '@/server/data/schema';

async function createFeeds(feeds: CreateFeedDto[]): Promise<CreateFeedResult[]> {
  try {
    const response = await fetch('/api/feed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feeds)
    });
    if (response.status === 400) {
      throw new Error(`Invalid feed: ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to create feeds: ${response.statusText}`);
    }

    const results: CreateFeedResult[] = await response.json();
    if (results.length !== feeds.length) {
      throw new Error('Failed to create all feeds');
    }

    return results;
  } catch (error) {
    console.error('Error occurred while creating feeds:', error);
    throw error;
  }
}

async function getFeedInfo(
  link: string
): Promise<{ title: string; description: string; link: string } | undefined> {
  try {
    const response = await fetch(`/api/feedInfo?link=${btoa(link)}`);
    if (!response.ok) {
      console.error('Error fetching info:', response.statusText);
      return undefined;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching info:', error);
    return undefined;
  }
}

async function getFeed(id: string): Promise<Feed | undefined> {
  try {
    const response = await fetch(`/api/feed?id=${id}`);
    if (!response.ok) {
      throw new Error(`Failed to get feed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error occurred while getting feed:', error);
    return undefined;
  }
}

async function updateFeed(
  id: string,
  name: string,
  description: string,
  link: string,
  collectionId: string
) {
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
    if (response.status === 400) {
      console.error(`Invalid feed: ${response.statusText}`);
      throw new Error('Invalid feed');
    }

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

async function getFeeds(take: number = 10, skip: number = 0): Promise<Feed[]> {
  try {
    const response = await fetch(`/api/feeds?&take=${take}&skip=${skip}`);
    if (!response.ok) {
      throw new Error(`Failed to get feeds: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error occurred while getting feeds:', error);
    return [];
  }
}

export default {
  createFeeds,
  getFeedInfo,
  getFeed,
  updateFeed,
  getFeeds
};
