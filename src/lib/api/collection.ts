import type { Collection } from '@/server/data/schema';

async function createCollection(name: string, feedIds: string[]): Promise<Collection> {
  const response = await fetch('/api/collection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, feedIds })
  });

  if (!response.ok) {
    throw new Error('Failed to create collection');
  }

  return response.json();
}

async function getCollectionBySlug(slug: string): Promise<Collection> {
  const response = await fetch(`/api/collection?slug=${slug}`);

  if (!response.ok) {
    throw new Error('Failed to get collection');
  }

  return response.json();
}

async function updateCollection(
  id: string,
  data: { name: string; feedsToAdd?: string[]; feedsToRemove?: string[] }
): Promise<{
  id: string;
  feedsAdded: string[];
  feedsRemoved: string[];
}> {
  const response = await fetch(`/api/collection?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to update collection');
  }

  return (await response.json()) as {
    id: string;
    feedsAdded: string[];
    feedsRemoved: string[];
  };
}

async function removeFeedFromCollection(collectionId: string, feedId: string): Promise<void> {
  const response = await fetch(`/api/collection?collectionId=${collectionId}&feedId=${feedId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('Failed to remove feed from collection');
  }
}

async function addFeedToCollection(collectionId: string, feedId: string): Promise<void> {
  const response = await fetch(`/api/collection?collectionId=${collectionId}&feedId=${feedId}`, {
    method: 'PUT'
  });

  if (!response.ok) {
    throw new Error('Failed to add feed to collection');
  }
}

export default {
  createCollection,
  getCollectionBySlug,
  updateCollection,
  removeFeedFromCollection,
  addFeedToCollection
};
