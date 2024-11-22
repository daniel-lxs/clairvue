import feedRepository from '@/server/data/repositories/feed.repository';
import type { Feed } from '@/server/data/schema';
import type { CreateFeedDto } from '@/server/dto/feed.dto';
import type { CreateFeedResult } from '@/types/CreateFeedResult';
import { getArticleQueue } from '@/server/queue/articles';
import collectionService from './collection.service';

async function findFeedById(id: string): Promise<Feed | undefined> {
  return await feedRepository.findById(id);
}

async function createFeed(feedData: CreateFeedDto, userId: string): Promise<CreateFeedResult> {
  try {
    const newFeedData = { ...feedData, description: feedData.description || null };
    const createdFeed = await feedRepository.create(newFeedData);

    if (!createdFeed) {
      return { result: 'error', reason: 'Unable to create' };
    }

    if (feedData.collectionId) {
      await collectionService.addFeedToCollection(feedData.collectionId, createdFeed.id);
    }

    // Always add to the default collection
    if (!feedData.collectionId.includes('default')) {
      const defaultCollection = await collectionService.findDefault(userId);

      if (!defaultCollection) {
        return { result: 'error', reason: 'Unable to find default collection' };
      }

      await collectionService.addFeedToCollection(defaultCollection.id, createdFeed.id);
    }

    if (!createdFeed.link.startsWith('default-feed')) {
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
    }

    return { result: 'success', data: createdFeed };
  } catch (error) {
    return { result: 'error', reason: 'Internal error' };
  }
}

async function updateFeed(
  id: string,
  data: Pick<Feed, 'name' | 'link' | 'description'>
): Promise<void> {
  await feedRepository.update(id, data);
}

async function findBySlug(slug: string): Promise<Feed> {
  const feed = await feedRepository.findBySlug(slug);

  if (!feed) {
    throw new Error('Feed not found');
  }

  return feed;
}

async function countArticles(id: string): Promise<number> {
  return (await feedRepository.countArticles(id)) ?? 0;
}

export default {
  findFeedById,
  createFeed,
  updateFeed,
  findBySlug,
  countArticles
};
