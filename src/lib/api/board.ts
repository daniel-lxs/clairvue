import type { Board } from '../server/data/schema';

export async function createBoard(name: string): Promise<Board | undefined> {
  try {
    const response = await fetch('/api/board', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name
      })
    });
    if (response.status === 400) {
      throw new Error(`Invalid board: ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to create board: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error occurred while creating board:', error);
    return undefined;
  }
}

export async function getBoardBySlug(slug: string): Promise<Board | undefined> {
  try {
    const response = await fetch(`/api/board?slug=${slug}`);
    if (!response.ok) {
      throw new Error(`Failed to get boards: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error occurred while getting boards:', error);
    return undefined;
  }
}

export async function updateBoard(id: string, name: string): Promise<Board | undefined> {
  try {
    const response = await fetch('/api/board', {
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
      console.error(`Invalid board: ${response.statusText}`);
      throw new Error('Invalid board');
    }

    if (!response.ok) {
      console.error(`Failed to update board: ${response.statusText}`);
      throw new Error('Failed to update board');
    }

    return await response.json();
  } catch (error) {
    console.error('Error occurred while updating board:', error);
    return undefined;
  }
}

export async function deleteFeedFromBoard(id: string, feedId: string) {
  try {
    const response = await fetch('/api/board', {
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
