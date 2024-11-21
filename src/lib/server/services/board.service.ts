import boardRepository from '@/server/data/repositories/board.repository';
import type { Board } from '@/server/data/schema';

export async function findBoardBySlug(userId: string, slug: string): Promise<Board | undefined> {
  return await boardRepository.findBySlug(userId, slug);
}

export async function createBoard(
  name: string,
  userId: string,
  defaultBoard?: boolean
): Promise<Pick<Board, 'id' | 'name' | 'slug'> | undefined> {
  return await boardRepository.create({ name, userId, default: defaultBoard });
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

export async function findBoardsByUserId(
  userId: string,
  withRelated: boolean = false
): Promise<Board[] | undefined> {
  return await boardRepository.findBoardsByUserId(userId, withRelated);
}

export async function findBoardById(
  id: string,
  withRelated: boolean = false
): Promise<Board | undefined> {
  return await boardRepository.findById(id, withRelated);
}

/*export async function deleteBoard(id: string): Promise<void> {
  await boardRepository.deleteBoard(id);
}*/
