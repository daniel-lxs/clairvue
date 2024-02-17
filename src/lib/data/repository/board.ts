import ShortUniqueId from 'short-unique-id';
import db from '../db';
import { boardSchema, type Board, rssFeedToBoard, rssFeedSchema } from '../schema';
import { eq } from 'drizzle-orm';

function create(newBoard: Pick<Board, 'name'>): { slug: string; editCode: string } | undefined {
	try {
		const { randomUUID } = new ShortUniqueId({ length: 8 });

		const id = randomUUID();
		const slug = randomUUID();
		const editCode = randomUUID();
		const currentDate = new Date();

		db.insert(boardSchema)
			.values({
				...newBoard,
				id,
				slug,
				editCode,
				createdAt: currentDate,
				updatedAt: currentDate
			})
			.run();
		return {
			slug,
			editCode
		};
	} catch (error) {
		console.error('Error occurred while creating new Board:', error);
		return undefined;
	}
}

function findById(id: string, withRelated: boolean = false): Board | undefined {
	try {
		const query = db.select().from(boardSchema).where(eq(boardSchema.id, id));

		if (withRelated) {
			const result = query
				.leftJoin(rssFeedSchema, eq(rssFeedToBoard.rssFeedId, rssFeedSchema.id))
				.all();

			const Board = result[0];
			if (!Board) return undefined;
			const { rssFeeds, ...rest } = Board;
			return {
				...rest.boards,
				rssFeeds: rssFeeds ? [rssFeeds] : []
			};
		}

		const result = query.all();
		const Board = result[0];
		if (!Board) return undefined;
		return Board;
	} catch (error) {
		console.error('Error occurred while finding Board by id:', error);
		return undefined;
	}
}

function findBySlug(slug: string, withRelated: boolean = false): Board | undefined {
	try {
		const query = db.select().from(boardSchema).where(eq(boardSchema.slug, slug));

		if (withRelated) {
			const result = query
				.leftJoin(rssFeedSchema, eq(rssFeedToBoard.rssFeedId, rssFeedSchema.id))
				.all();

			const Board = result[0];
			if (!Board) return undefined;
			const { rssFeeds, ...rest } = Board;
			return {
				...rest.boards,
				rssFeeds: rssFeeds ? [rssFeeds] : []
			};
		}

		const result = query.all();
		const Board = result[0];
		if (!Board) return undefined;
		return Board;
	} catch (error) {
		console.error('Error occurred while finding Board by id:', error);
		return undefined;
	}
}

function update(updatedBoard: Pick<Board, 'slug' | 'name'>) {
	try {
		const currentDate = new Date();
		db.update(boardSchema)
			.set({
				...updatedBoard,
				updatedAt: currentDate
			})
			.where(eq(boardSchema.slug, updatedBoard.slug))
			.run();
	} catch (error) {
		console.error('Error occurred while updating Board:', error);
	}
}

export default {
	create,
	findById,
	findBySlug,
	update
};
