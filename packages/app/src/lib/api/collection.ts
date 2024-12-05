import type { Collection } from '@/server/data/schema';
import { normalizeError } from '@/utils';
import { Result } from '@clairvue/types';

async function createCollection(
  name: string,
  feedIds: string[]
): Promise<
  Result<
    {
      collection: Collection;
      validationErrors: string[];
      assignmentErrors: string[];
    },
    Error
  >
> {
  try {
    const response = await fetch('/api/collection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, feedIds })
    });

    if (!response.ok) {
      const error = await response.text();
      return Result.err(new Error(`Failed to create collection: ${error}`));
    }

    return Result.ok(await response.json());
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while creating collection:', error);
    return Result.err(error);
  }
}

async function getCollectionBySlug(slug: string): Promise<Result<Collection, Error>> {
  try {
    const response = await fetch(`/api/collection?slug=${slug}`);

    if (!response.ok) {
      const error = await response.text();
      return Result.err(new Error(`Failed to get collection: ${error}`));
    }

    return Result.ok(await response.json());
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting collection by slug:', error);
    return Result.err(error);
  }
}

async function updateCollection(
  id: string,
  data: { name?: string; feedsToAdd?: string[]; feedsToRemove?: string[] }
): Promise<
  Result<
    {
      assignmentErrors: string[];
      removalErrors: string[];
    },
    Error
  >
> {
  try {
    const response = await fetch(`/api/collection?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      return Result.err(new Error(`Failed to update collection: ${error}`));
    }

    return Result.ok(await response.json());
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while updating collection:', error);
    return Result.err(error);
  }
}

async function removeFeedFromCollection(
  collectionId: string,
  feedId: string
): Promise<Result<true, Error>> {
  try {
    const response = await fetch(`/api/collection?collectionId=${collectionId}&feedId=${feedId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.text();
      return Result.err(new Error(`Failed to remove feed from collection: ${error}`));
    }

    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while removing feed from collection:', error);
    return Result.err(error);
  }
}

export default {
  createCollection,
  getCollectionBySlug,
  updateCollection,
  removeFeedFromCollection
};
