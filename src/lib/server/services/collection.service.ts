import collectionRepository from '@/server/data/repositories/collection.repository';
import type { Collection } from '@/server/data/schema';

export async function findCollectionBySlug(
  userId: string,
  slug: string
): Promise<Collection | undefined> {
  return await collectionRepository.findBySlug(userId, slug);
}

export async function createCollection(
  name: string,
  userId: string,
  defaultCollection?: boolean
): Promise<Pick<Collection, 'id' | 'name' | 'slug'> | undefined> {
  return await collectionRepository.create({ name, userId, default: defaultCollection });
}

export async function updateCollection(id: string, data: Pick<Collection, 'name'>) {
  await collectionRepository.update(id, data);
}

export async function addFeedToCollection(collectionId: string, feedId: string): Promise<void> {
  await collectionRepository.addFeedsToCollection([{ id: collectionId, feedId }]);
}

export async function removeFeedFromCollection(
  collectionId: string,
  feedId: string
): Promise<void> {
  await collectionRepository.deleteFeedFromCollection(collectionId, feedId);
}

export async function findCollectionsByUserId(
  userId: string,
  withRelated: boolean = false
): Promise<Collection[] | undefined> {
  return await collectionRepository.findCollectionsByUserId(userId, withRelated);
}

export async function findCollectionById(
  id: string,
  withRelated: boolean = false
): Promise<Collection | undefined> {
  return await collectionRepository.findById(id, withRelated);
}

/*export async function deleteCollection(id: string): Promise<void> {
  await collectionRepository.deleteCollection(id);
}*/
