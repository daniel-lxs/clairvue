import boardRepository from '@/server/data/repositories/board';
import type { Board } from '@/server/data/schema';

export async function findBoardBySlug(userId: string, slug: string): Promise<Board | undefined> {
  return await boardRepository.findBySlug(userId, slug);
}

export async function createBoard(data: {
  name: string;
  userId: string;
}): Promise<Pick<Board, 'id' | 'name' | 'slug'> | undefined> {
  return await boardRepository.create(data);
}

export async function updateBoard(id: string, data: Pick<Board, 'name'>) {
  await boardRepository.update(id, data);
}

export async function addFeedToBoard(boardId: string, feedId: string): Promise<void> {
  await boardRepository.addFeedsToBoard([{ id: boardId, feedId }]);
}

export async function removeFeedFromBoard(boardId: string, feedId: string): Promise<void> {
  await boardRepository.deleteFeedFromBoard(boardId, feedId);
}

/*export async function deleteBoard(id: string): Promise<void> {
  await boardRepository.deleteBoard(id);
}*/
