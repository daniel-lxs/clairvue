import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import { boardSchema, rssFeedSchema, boardsToRssFeeds, type Board } from '../schema';
import { eq } from 'drizzle-orm';

async function create(newBoard: Pick<Board, 'name'>) {
	try {
		const db = getClient();
		const { randomUUID } = new ShortUniqueId({ length: 8 });

		const id = randomUUID();
		const slug = randomUUID();
		const editCode = randomUUID();

		await db
			.insert(boardSchema)
			.values({
				...newBoard,
				id,
				slug,
				editCode
			})
			.execute();
		return {
			id,
			slug,
			editCode
		};
	} catch (error) {
		console.error('Error occurred while creating new Board:', error);
		return undefined;
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

async function findBySlug(slug: string, withRelated: boolean = false): Promise<Board | undefined> {
	try {
		const db = getClient();

		if (withRelated) {
			const { boards, rssFeeds } = (
				await db
					.select()
					.from(boardsToRssFeeds)
					.leftJoin(boardSchema, eq(boardsToRssFeeds.boardId, boardSchema.id))
					.leftJoin(rssFeedSchema, eq(boardsToRssFeeds.rssFeedId, rssFeedSchema.id))
					.where(eq(boardSchema.slug, slug))
					.execute()
			)[0];

			if (!boards) return undefined;

			return {
				...boards,
				rssFeeds: rssFeeds ? [rssFeeds] : []
			};
		}

		const result = await db.query.boardSchema
			.findFirst({
				where: eq(boardSchema.slug, slug)
			})
			.execute();

		if (result) return undefined;

		return result;
	} catch (error) {
		console.error('Error occurred while finding Board by id:', error);
		return undefined;
	}
}

export default {
	create,
	findById,
	findBySlug
};
