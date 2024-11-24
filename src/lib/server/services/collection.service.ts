import collectionRepository from '@/server/data/repositories/collection.repository';
import type { Collection, CollectionWithFeeds } from '@/server/data/schema';

async function findBySlug(userId: string, slug: string): Promise<Collection | undefined> {
  return await collectionRepository.findBySlug(userId, slug);
}

async function create(
  name: string,
  userId: string,
  defaultCollection?: boolean
): Promise<Pick<Collection, 'id' | 'name' | 'slug'> | undefined> {
  return await collectionRepository.create({ name, userId, default: defaultCollection });
}

async function update(id: string, data: Pick<Collection, 'name'>) {
  await collectionRepository.update(id, data);
}

async function addFeedToCollection(collectionId: string, feedId: string): Promise<void> {
  await collectionRepository.addFeedsToCollection([{ id: collectionId, feedId }]);
}

async function removeFeedFromCollection(collectionId: string, feedId: string): Promise<void> {
  await collectionRepository.deleteFeedFromCollection(collectionId, feedId);
}

async function addFeedsToCollection(collectionId: string, feedIds: string[]): Promise<void> {
  const assignments = feedIds.map((feedId) => ({ id: collectionId, feedId }));
  await collectionRepository.addFeedsToCollection(assignments);
}

async function removeFeedsFromCollection(collectionId: string, feedIds: string[]): Promise<void> {
  for (const feedId of feedIds) {
    await collectionRepository.deleteFeedFromCollection(collectionId, feedId);
  }
}

async function findByUserId(userId: string): Promise<Collection[] | undefined> {
  return await collectionRepository.findByUserId(userId);
}

async function findByUserIdWithFeeds(userId: string): Promise<CollectionWithFeeds[] | undefined> {
  return await collectionRepository.findByUserIdWithFeeds(userId);
}

async function findById(id: string): Promise<Collection | undefined> {
  return await collectionRepository.findById(id);
}

async function findByIdWithFeeds(id: string): Promise<CollectionWithFeeds | undefined> {
  return await collectionRepository.findByIdWithFeeds(id);
}

async function findDefault(userId: string): Promise<Collection | undefined> {
  return await collectionRepository.findDefaultByUserId(userId);
}

async function findDefaultWithFeeds(userId: string): Promise<CollectionWithFeeds | undefined> {
  return await collectionRepository.findDefaultByUserIdWithFeeds(userId);
}

/* async function deleteCollection(id: string): Promise<void> {
  await collectionRepository.deleteCollection(id);
}*/

export default {
  findBySlug,
  create,
  update,
  addFeedToCollection,
  removeFeedFromCollection,
  addFeedsToCollection,
  removeFeedsFromCollection,
  findByUserId,
  findByUserIdWithFeeds,
  findById,
  findByIdWithFeeds,
  findDefault,
  findDefaultWithFeeds
};
