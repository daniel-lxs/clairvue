import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import {
	articleSchema,
	type Article,
	rssFeedSchema,
	boardSchema,
	boardsToRssFeeds
} from '../schema';
import { count, desc, eq, sql } from 'drizzle-orm';
import type { NewArticle } from '@/types/NewArticle';
import type { PaginatedList } from '@/types/PaginatedList';

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

async function existsWithLink(link: string): Promise<boolean | undefined> {
	try {
		const db = getClient();
		const [{ exists }]: { exists: boolean }[] = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1
      FROM ${articleSchema}
      WHERE ${articleSchema.link} = ${link}
      LIMIT 1
    )
  `);
		return exists;
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
	skip = 0,
	take = 5
): Promise<PaginatedList<Article> | undefined> {
	try {
		const db = getClient();

		// Check if the boardId exists
		const boardExists = await db
			.select()
			.from(boardSchema)
			.where(eq(boardSchema.id, boardId))
			.execute();

		if (!boardExists || boardExists.length === 0) {
			return undefined;
		}

		// Join the articles with their corresponding rssFeeds
		const queryResult = await db
			.select({
				id: articleSchema.id,
				title: articleSchema.title,
				description: articleSchema.description,
				link: articleSchema.link,
				image: articleSchema.image,
				siteName: articleSchema.siteName,
				author: articleSchema.author,
				publishedAt: articleSchema.publishedAt,
				readable: articleSchema.readable,
				rssFeedId: articleSchema.rssFeedId,
				rssFeed: {
					id: rssFeedSchema.id,
					name: rssFeedSchema.name,
					description: rssFeedSchema.description,
					link: rssFeedSchema.link,
					createdAt: rssFeedSchema.createdAt,
					updatedAt: rssFeedSchema.updatedAt,
					syncedAt: rssFeedSchema.syncedAt
				},
				createdAt: articleSchema.createdAt,
				updatedAt: articleSchema.updatedAt
			})
			.from(articleSchema)
			.leftJoin(rssFeedSchema, eq(articleSchema.rssFeedId, rssFeedSchema.id))
			.leftJoin(boardsToRssFeeds, eq(rssFeedSchema.id, boardsToRssFeeds.rssFeedId))
			.where(eq(boardsToRssFeeds.boardId, boardId))
			.orderBy(desc(articleSchema.publishedAt))
			.limit(take)
			.offset(skip)
			.execute();

		const articleCount = await db
			.select({ articlesCount: sql<number>`cast(${count(articleSchema.id)} as int)` })
			.from(articleSchema)
			.leftJoin(rssFeedSchema, eq(articleSchema.rssFeedId, rssFeedSchema.id))
			.leftJoin(boardsToRssFeeds, eq(rssFeedSchema.id, boardsToRssFeeds.rssFeedId))
			.where(eq(boardsToRssFeeds.boardId, boardId))
			.execute();

		return {
			items: queryResult,
			totalCount: articleCount[0].articlesCount
		};
	} catch (error) {
		console.log('Error occurred while finding Articles by boardId:', error);
	}
}

export default {
	create,
	findById,
	existsWithLink,
	findByRssFeedId,
	findByBoardId
};
