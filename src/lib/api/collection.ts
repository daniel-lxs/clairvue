import type { Collection } from '../server/data/schema';

export async function createCollection(name: string): Promise<Collection | undefined> {
  try {
    const response = await fetch('/api/collection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name
      })
    });
    if (response.status === 400) {
      throw new Error(`Invalid collection: ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to create collection: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error occurred while creating collection:', error);
    return undefined;
  }
}

export async function getCollectionBySlug(slug: string): Promise<Collection | undefined> {
  try {
    const response = await fetch(`/api/collection?slug=${slug}`);
    if (!response.ok) {
      throw new Error(`Failed to get collections: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error occurred while getting collections:', error);
    return undefined;
  }
}

export async function updateCollection(id: string, name: string): Promise<Collection | undefined> {
  try {
    const response = await fetch('/api/collection', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: id,
        name: name
      })
    });
    if (response.status === 400) {
      console.error(`Invalid collection: ${response.statusText}`);
      throw new Error('Invalid collection');
    }

    if (!response.ok) {
      console.error(`Failed to update collection: ${response.statusText}`);
      throw new Error('Failed to update collection');
    }

    return await response.json();
  } catch (error) {
    console.error('Error occurred while updating collection:', error);
    return undefined;
  }
}

export async function deleteFeedFromCollection(id: string, feedId: string) {
  try {
    const response = await fetch('/api/collection', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id,
        feedId
      })
    });
    if (!response.ok) {
      console.error(`Failed to delete feed: ${response.statusText}`);
      throw new Error('Failed to delete feed');
    }
  } catch (error) {
    console.error('Error occurred while deleting feed:', error);
    throw error;
  }
}
