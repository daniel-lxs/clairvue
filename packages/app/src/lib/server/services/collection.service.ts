import collectionRepository from '@/server/data/repositories/collection.repository';
import type { Collection, CollectionWithFeeds } from '@/server/data/schema';
import type { AddFeedsToCollectionResult } from '@clairvue/types';
import { Result } from '@clairvue/types';

async function findBySlug(
  userId: string,
  slug: string
): Promise<Result<Collection | false, Error>> {
  return await collectionRepository.findBySlug(userId, slug);
}

async function create(name: string, userId: string): Promise<Result<Collection, Error>> {
  return await collectionRepository.create({ name, userId });
}

async function createDefault(name: string, userId: string): Promise<Result<Collection, Error>> {
  return await collectionRepository.createDefault({ name, userId });
}

async function update(id: string, data: Pick<Collection, 'name'>): Promise<Result<true, Error>> {
  return await collectionRepository.update(id, data);
}

async function addFeedToCollection(
  collectionId: string,
  feedId: string
): Promise<Result<AddFeedsToCollectionResult, Error>> {
  return await collectionRepository.addFeedsToCollection(collectionId, [feedId]);
}

async function removeFeedFromCollection(
  collectionId: string,
  feedId: string
): Promise<Result<true, Error>> {
  return await collectionRepository.removeFeedFromCollection(collectionId, feedId);
}

async function addFeedsToCollection(
  collectionId: string,
  feedIds: string[]
): Promise<Result<AddFeedsToCollectionResult, Error>> {
  const result = await collectionRepository.addFeedsToCollection(collectionId, feedIds);

  return result.match({
    ok: (errors) => Result.ok(errors),
    err: (error) => Result.err(error)
  });
}

async function removeFeedsFromCollection(
  collectionId: string,
  feedIds: string[]
): Promise<Result<true, Error>[]> {
  const results: Result<true, Error>[] = [];

  for (const feedId of feedIds) {
    results.push(
      (await collectionRepository.removeFeedFromCollection(collectionId, feedId)).match({
        ok: () => Result.ok(true),
        err: (error) => Result.err(error)
      })
    );
  }
  return results;
}

async function findByUserId(userId: string): Promise<Result<Collection[] | false, Error>> {
  return await collectionRepository.findByUserId(userId);
}

async function findByUserIdWithFeeds(
  userId: string
): Promise<Result<CollectionWithFeeds[] | false, Error>> {
  return await collectionRepository.findByUserIdWithFeeds(userId);
}

async function findById(id: string): Promise<Result<Collection | false, Error>> {
  return await collectionRepository.findById(id);
}

async function findByIdWithFeeds(id: string): Promise<Result<CollectionWithFeeds | false, Error>> {
  return await collectionRepository.findByIdWithFeeds(id);
}

async function findDefault(userId: string): Promise<Result<Collection | false, Error>> {
  return await collectionRepository.findDefaultByUserId(userId);
}

async function findDefaultWithFeeds(
  userId: string
): Promise<Result<CollectionWithFeeds | false, Error>> {
  return await collectionRepository.findDefaultByUserIdWithFeeds(userId);
}

/* async function deleteCollection(id: string): Promise<void> {
  await collectionRepository.deleteCollection(id);
}*/

export default {
  findBySlug,
  create,
  createDefault,
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
