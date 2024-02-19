import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import * as schema from '../schema';
import { eq } from 'drizzle-orm';

async function create(newBoard: Pick<schema.Board, 'name'>) {
	try {
		const db = getClient();
		const { boardSchema } = schema;
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
			slug,
			editCode
		};
	} catch (error) {
		console.error('Error occurred while creating new Board:', error);
		return undefined;
	}
}

async function findById(
	id: string,
	withRelated: boolean = false
): Promise<schema.Board | undefined> {
	try {
		const db = getClient();

		const { boardSchema, rssFeedSchema, boardsToRssFeeds } = schema;

		if (withRelated) {
			const { boards, rssFeeds } = (
				await db
					.select()
					.from(boardsToRssFeeds)
					.leftJoin(boardSchema, eq(boardsToRssFeeds.boardId, boardSchema.id))
					.leftJoin(rssFeedSchema, eq(boardsToRssFeeds.rssFeedId, rssFeedSchema.id))
					.where(eq(boardSchema.id, id))
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
	slug: string,
	withRelated: boolean = false
): Promise<schema.Board | undefined> {
	try {
		const db = getClient();

		const { boardSchema, rssFeedSchema, boardsToRssFeeds } = schema;

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
