import feedRepository from '@/server/data/repositories/feed';
import type { Feed } from '@/server/data/schema';
import type { CreateFeedDto } from '@/server/dto/feedDto';
import type { CreateFeedResult } from '@/types/CreateFeedResult';
import { getArticleQueue } from '@/server/queue/articles';

export async function findFeedById(id: string): Promise<Feed | null> {
  return await feedRepository.findById(id);
}

export async function createFeed(feedData: CreateFeedDto): Promise<CreateFeedResult> {
  try {
    const newFeedData = { ...feedData, description: feedData.description || null };
    const createdFeed = await feedRepository.create(newFeedData);

    if (!createdFeed) {
      return { result: 'error', data: null, reason: 'Unable to create' };
    }

    const articleQueue = getArticleQueue();
    articleQueue?.add(
      'sync',
      { feedId: createdFeed.id },
      {
        jobId: createdFeed.id,
        removeOnComplete: true,
        removeOnFail: true
      }
    );

    return { result: 'success', data: createdFeed, reason: null };
  } catch (error) {
    return { result: 'error', data: null, reason: 'Internal error' };
  }
}

export async function updateFeed(id: string, data: Pick<Feed, 'name' | 'link' | 'description'>): Promise<void> {
  await feedRepository.update(id, data);
}
