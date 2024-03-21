import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import { boardSchema, rssFeedSchema, boardsToRssFeeds, type Board } from '../schema';
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

async function addFeedsToBoard(assignments: { id: string; rssFeedId: string }[]) {
	try {
		const db = getClient();

		for (const { id, rssFeedId } of assignments) {
			const rssFeedExists = await db.query.rssFeedSchema
				.findFirst({ where: eq(rssFeedSchema.id, rssFeedId) })
				.execute();

			if (!rssFeedExists) {
				throw new Error('RSS feed does not exist');
			}

			const isAlreadyRelated = await db.query.boardsToRssFeeds
				.findFirst({
					where: and(eq(boardsToRssFeeds.boardId, id), eq(boardsToRssFeeds.rssFeedId, rssFeedId))
				})
				.execute();

			if (!isAlreadyRelated) {
				await db
					.insert(boardsToRssFeeds)
					.values({
						boardId: id,
						rssFeedId
					})
					.execute();
			}
		}
	} catch (error) {
		console.error('Error occurred while assigning RSS feed to Board:', error);
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
				.leftJoin(boardsToRssFeeds, eq(boardsToRssFeeds.boardId, boardSchema.id))
				.leftJoin(rssFeedSchema, eq(boardsToRssFeeds.rssFeedId, rssFeedSchema.id))
				.where(eq(boardSchema.id, id))
				.execute();

			if (!result || result.length === 0) return undefined;

			const rssFeeds = result.map((r) => (r.rssFeeds ? [r.rssFeeds] : []));

			return {
				...result[0].boards,
				rssFeeds: rssFeeds.flat()
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
				.leftJoin(boardsToRssFeeds, eq(boardsToRssFeeds.boardId, boardSchema.id))
				.leftJoin(rssFeedSchema, eq(boardsToRssFeeds.rssFeedId, rssFeedSchema.id))
				.where(and(eq(boardSchema.userId, userId), eq(boardSchema.slug, slug)))
				.execute();

			if (!result || result.length === 0) return undefined;

			const rssFeeds = result.map((r) => (r.rssFeeds ? [r.rssFeeds] : []));

			return {
				...result[0].boards,
				rssFeeds: rssFeeds.flat()
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
					boardsToRssfeeds: {
						columns: {},
						with: {
							rssFeed: true
						}
					}
				}
			});

			if (!result || result.length === 0) return undefined;

			const processedBoards = await Promise.all(
				result.map(async (board) => {
					const rssFeeds = await Promise.all(
						board.boardsToRssfeeds?.map(async (b) => b.rssFeed) || []
					);
					return {
						id: board.id,
						slug: board.slug,
						name: board.name,
						createdAt: board.createdAt,
						updatedAt: board.updatedAt,
						userId: board.userId,
						rssFeeds
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

async function deleteFeedFromBoard(boardId: string, rssFeedId: string) {
	try {
		const db = getClient();
		await db
			.delete(boardsToRssFeeds)
			.where(and(eq(boardsToRssFeeds.boardId, boardId), eq(boardsToRssFeeds.rssFeedId, rssFeedId)))
			.execute();
	} catch (error) {
		console.error('Error occurred while deleting RSS feed from Board:', error);
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
