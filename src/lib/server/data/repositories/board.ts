import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import { boardSchema, feedSchema, boardsToFeeds, type Board } from '../schema';
import { and, eq } from 'drizzle-orm';

async function create(newBoard: Pick<Board, 'name' | 'userId'>) {
	//TODO: Limit the number of boards per user to 5
	try {
		const db = getClient();
		const { randomUUID } = new ShortUniqueId({ length: 8 });

		const id = randomUUID();
		const slug = randomUUID();

		await db
			.insert(boardSchema)
			.values({
				...newBoard,
				id,
				slug
			})
			.execute();
		return {
			id,
			slug
		};
	} catch (error) {
		console.error('Error occurred while creating new Board:', error);
		return undefined;
	}
}

async function update(id: string, newBoard: Pick<Board, 'name'>) {
	try {
		const db = getClient();
		await db
			.update(boardSchema)
			.set({
				...newBoard
			})
			.where(eq(boardSchema.id, id))
			.execute();
	} catch (error) {
		console.error('Error occurred while updating Board:', error);
		throw error;
	}
}

async function addFeedsToBoard(assignments: { id: string; feedId: string }[]) {
	try {
		const db = getClient();

		for (const { id, feedId } of assignments) {
			const feedExists = await db.query.feedSchema
				.findFirst({ where: eq(feedSchema.id, feedId) })
				.execute();

			if (!feedExists) {
				throw new Error('Feed does not exist');
			}

			const isAlreadyRelated = await db.query.boardsToFeeds
				.findFirst({
					where: and(eq(boardsToFeeds.boardId, id), eq(boardsToFeeds.feedId, feedId))
				})
				.execute();

			if (!isAlreadyRelated) {
				await db
					.insert(boardsToFeeds)
					.values({
						boardId: id,
						feedId
					})
					.execute();
			}
		}
	} catch (error) {
		console.error('Error occurred while adding feeds to board:', error);
		throw error;
	}
}

async function findById(id: string, withRelated: boolean = false): Promise<Board | undefined> {
	try {
		const db = getClient();

		if (withRelated) {
			const result = await db
				.select()
				.from(boardSchema)
				.leftJoin(boardsToFeeds, eq(boardsToFeeds.boardId, boardSchema.id))
				.leftJoin(feedSchema, eq(boardsToFeeds.feedId, feedSchema.id))
				.where(eq(boardSchema.id, id))
				.execute();

			if (!result || result.length === 0) return undefined;

			const feeds = result.map((r) => (r.feeds ? [r.feeds] : []));

			return {
				...result[0].boards,
				feeds: feeds.flat()
			};
		}

		const result = await db.query.boardSchema
			.findFirst({
				where: eq(boardSchema.id, id)
			})
			.execute();

		if (result) return undefined;

		return result;
	} catch (error) {
		console.error('Error occurred while finding Board by id:', error);
		return undefined;
	}
}

async function findBySlug(
	userId: string,
	slug: string,
	withRelated: boolean = false
): Promise<Board | undefined> {
	try {
		const db = getClient();

		if (withRelated) {
			const result = await db
				.select()
				.from(boardSchema)
				.leftJoin(boardsToFeeds, eq(boardsToFeeds.boardId, boardSchema.id))
				.leftJoin(feedSchema, eq(boardsToFeeds.feedId, feedSchema.id))
				.where(and(eq(boardSchema.userId, userId), eq(boardSchema.slug, slug)))
				.execute();

			if (!result || result.length === 0) return undefined;

			const feeds = result.map((r) => (r.feeds ? [r.feeds] : []));

			return {
				...result[0].boards,
				feeds: feeds.flat()
			};
		}

		const result = await db.query.boardSchema
			.findFirst({
				where: and(eq(boardSchema.userId, userId), eq(boardSchema.slug, slug))
			})
			.execute();

		if (!result) return undefined;

		return result;
	} catch (error) {
		console.error('Error occurred while finding Board by id:', error);
		return undefined;
	}
}

async function findBoardsByUserId(
	userId: string,
	withRelated: boolean = false
): Promise<Board[] | undefined> {
	try {
		const db = getClient();

		if (withRelated) {
			const result = await db.query.boardSchema.findMany({
				where: eq(boardSchema.userId, userId),
				with: {
					boardsToFeeds: {
						columns: {},
						with: {
							feed: true
						}
					}
				}
			});

			if (!result || result.length === 0) return undefined;

			const processedBoards = await Promise.all(
				result.map(async (board) => {
					const feeds = await Promise.all(board.boardsToFeeds?.map(async (b) => b.feed) || []);
					return {
						id: board.id,
						slug: board.slug,
						name: board.name,
						createdAt: board.createdAt,
						updatedAt: board.updatedAt,
						userId: board.userId,
						feeds
					};
				})
			);

			return processedBoards;
		}
		const result = await db
			.select()
			.from(boardSchema)
			.where(eq(boardSchema.userId, userId))
			.execute();

		if (!result || result.length === 0) return undefined;
	} catch (error) {
		console.error('Error occurred while finding Board by user id:', error);
		return [];
	}
}

async function deleteFeedFromBoard(boardId: string, feedId: string) {
	try {
		const db = getClient();
		await db
			.delete(boardsToFeeds)
			.where(and(eq(boardsToFeeds.boardId, boardId), eq(boardsToFeeds.feedId, feedId)))
			.execute();
	} catch (error) {
		console.error('Error occurred while deleting feed:', error);
		throw error;
	}
}

export default {
	create,
	update,
	findById,
	findBySlug,
	findBoardsByUserId,
	addFeedsToBoard,
	deleteFeedFromBoard
};
