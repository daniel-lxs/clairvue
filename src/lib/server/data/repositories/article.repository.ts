import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import { articleSchema, type Article, feedSchema, boardSchema, boardsToFeeds } from '../schema';
import { count, desc, eq, lt, sql, and, gt } from 'drizzle-orm';
import type { NewArticle } from '@/types/NewArticle';
import type { PaginatedList } from '@/types/PaginatedList';

async function create(newArticles: NewArticle | NewArticle[]): Promise<string[] | undefined> {
  const db = getClient();
  const { randomUUID } = new ShortUniqueId({ length: 8 });

  const toCreate = Array.isArray(newArticles)
    ? newArticles.map((article) => ({ slug: randomUUID(), ...article }))
    : [{ slug: randomUUID(), ...newArticles }];

  try {
    const result = await db
      .insert(articleSchema)
      .values(toCreate)
      .onConflictDoNothing()
      .returning({
        slug: articleSchema.slug
      })
      .execute();

    if (!result || result.length === 0) return undefined;

    return result.map((r) => r.slug);
  } catch (error) {
    console.error('Error occurred while creating new Article:', error);
    return undefined;
  }
}

async function findBySlug(slug: string): Promise<Article | undefined> {
  try {
    const db = getClient();
    const result = await db
      .select()
      .from(articleSchema)
      .where(eq(articleSchema.slug, slug))
      .execute();
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

async function findByFeedId(
  feedId: string,
  beforePublishedAt: string = new Date().toISOString(),
  take = 5
): Promise<PaginatedList<Article> | undefined> {
  try {
    const db = getClient();
    const result = await db.query.articleSchema.findMany({
      where: and(
        eq(articleSchema.feedId, feedId),
        lt(articleSchema.publishedAt, new Date(beforePublishedAt))
      ),
      with: {
        feed: true
      },
      limit: take,
      orderBy: (articleSchema, { desc }) => desc(articleSchema.publishedAt)
    });
    return {
      items: result,
      totalCount: result.length
    };
  } catch (error) {
    console.error('Error occurred while finding Article by feedId:', error);
    return undefined;
  }
}

async function findByBoardId(
  boardId: string,
  beforePublishedAt: string = new Date().toISOString(),
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

    // Get articles after the provided publishedAt, ordered by publishedAt
    const queryResult = await db
      .select({
        id: articleSchema.id,
        slug: articleSchema.slug,
        title: articleSchema.title,
        description: articleSchema.description,
        link: articleSchema.link,
        image: articleSchema.image,
        siteName: articleSchema.siteName,
        author: articleSchema.author,
        publishedAt: articleSchema.publishedAt,
        readable: articleSchema.readable,
        feedId: articleSchema.feedId,
        feed: {
          id: feedSchema.id,
          name: feedSchema.name,
          description: feedSchema.description,
          link: feedSchema.link,
          createdAt: feedSchema.createdAt,
          updatedAt: feedSchema.updatedAt,
          syncedAt: feedSchema.syncedAt
        },
        createdAt: articleSchema.createdAt,
        updatedAt: articleSchema.updatedAt
      })
      .from(articleSchema)
      .leftJoin(feedSchema, eq(articleSchema.feedId, feedSchema.id))
      .leftJoin(boardsToFeeds, eq(feedSchema.id, boardsToFeeds.feedId))
      .where(
        and(
          eq(boardsToFeeds.boardId, boardId),
          lt(articleSchema.publishedAt, new Date(beforePublishedAt))
        )
      )
      .orderBy(desc(articleSchema.publishedAt))
      .limit(take)
      .execute();

    return {
      items: queryResult,
      totalCount: queryResult.length
    };
  } catch (error) {
    console.log('Error occurred while finding Articles by boardId:', error);
  }
}

async function countArticles(
  afterPublishedAt: Date,
  feedId?: string,
  boardId?: string
): Promise<number | undefined> {
  const db = getClient();

  const articleCount = await db
    .select({ count: sql<number>`cast(${count(articleSchema.id)} as int)` })
    .from(articleSchema)
    .leftJoin(feedSchema, eq(articleSchema.feedId, feedSchema.id))
    .leftJoin(boardsToFeeds, eq(feedSchema.id, boardsToFeeds.feedId))
    .where(
      and(
        boardId ? eq(boardsToFeeds.boardId, boardId) : undefined,
        feedId ? eq(boardsToFeeds.feedId, feedId) : undefined,
        gt(articleSchema.publishedAt, afterPublishedAt)
      )
    )
    .execute();

  return articleCount[0].count;
}

export default {
  create,
  findBySlug,
  existsWithLink,
  findByFeedId,
  findByBoardId,
  countArticles
};
