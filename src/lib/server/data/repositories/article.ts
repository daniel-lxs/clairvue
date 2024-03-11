import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import { articleSchema, type Article } from '../schema';
import { count, eq, or, sql } from 'drizzle-orm';
import type { NewArticle } from '@/types/NewArticle';
import boardRepository from './board';
import type { PaginatedList } from '../../../types/PaginatedList';

async function create(newArticles: NewArticle | NewArticle[]): Promise<string[] | undefined> {
	const db = getClient();
	const { randomUUID } = new ShortUniqueId({ length: 8 });

	const toCreate = Array.isArray(newArticles)
		? newArticles.map((article) => ({ id: randomUUID(), ...article }))
		: [{ id: randomUUID(), ...newArticles }];

	try {
		const result = await db
			.insert(articleSchema)
			.values(toCreate)
			.onConflictDoNothing()
			.returning({
				id: articleSchema.id
			})
			.execute();

		return result.map((r) => r.id);
	} catch (error) {
		console.error('Error occurred while creating new Article:', error);
		return undefined;
	}
}

async function findById(id: string): Promise<Article | undefined> {
	try {
		const db = getClient();
		const result = await db.select().from(articleSchema).where(eq(articleSchema.id, id)).execute();
		return result[0];
	} catch (error) {
		console.error('Error occurred while finding Article by id:', error);
		return undefined;
	}
}

async function findByLink(link: string): Promise<Article | undefined> {
	try {
		const db = getClient();
		const result = await db.query.articleSchema.findFirst({
			where: eq(articleSchema.link, link)
		});
		return result;
	} catch (error) {
		console.error('Error occurred while finding Article by link:', error);
		return undefined;
	}
}

//TODO: implement pagination
async function findByRssFeedId(rssFeedId: string): Promise<Article[] | undefined> {
	try {
		const db = getClient();
		const result = await db.query.articleSchema.findMany({
			where: eq(articleSchema.rssFeedId, rssFeedId),
			orderBy: (articleSchema, { desc }) => desc(articleSchema.publishedAt)
		});
		return result;
	} catch (error) {
		console.error('Error occurred while finding Article by rssFeedId:', error);
		return undefined;
	}
}

async function findByBoardId(
	boardId: string,
	page: number = 1
): Promise<PaginatedList<Article> | undefined> {
	try {
		const board = await boardRepository.findById(boardId, true);
		if (!board) {
			return undefined;
		}

		const rssFeedIds = board.rssFeeds?.map((rssFeed) => rssFeed.id);

		if (!rssFeedIds || rssFeedIds?.length === 0 || !board.rssFeeds || board.rssFeeds.length === 0) {
			return undefined;
		}

		const andStatement = rssFeedIds.map((rssFeedId) => eq(articleSchema.rssFeedId, rssFeedId));

		const db = getClient();

		const articleCount = db
			.select({ articlesCount: sql<number>`cast(${count(articleSchema.id)} as int)` })
			.from(articleSchema)
			.where(or(...andStatement))
			.execute();

		const queryResult = db.query.articleSchema.findMany({
			where: or(...andStatement),
			orderBy: (articleSchema, { desc }) => desc(articleSchema.publishedAt),
			limit: 20, //TODO: implement pagination
			offset: (page - 1) * 20
		});

		const result = await Promise.all([queryResult, articleCount]);

		for (const article of result[0]) {
			const rssFeed = board.rssFeeds.find((rssFeed) => rssFeed.id === article.rssFeedId);
			if (rssFeed) {
				(article as Article).rssFeed = rssFeed;
			}
		}

		return {
			items: result[0],
			totalCount: result[1][0].articlesCount
		};
	} catch (error) {
		console.log('Error occurred while finding Articles by boardId:', error);
	}
}

export default {
	create,
	findById,
	findByLink,
	findByRssFeedId,
	findByBoardId
};
