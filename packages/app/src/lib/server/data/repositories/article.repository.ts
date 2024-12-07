import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import {
  articleSchema,
  type Article,
  feedSchema,
  collectionSchema,
  collectionsToFeeds
} from '../schema';
import { count, desc, eq, lt, sql, and, gt } from 'drizzle-orm';
import { Result } from '@clairvue/types';
import type { ArticleWithFeed, NewArticle, PaginatedList } from '@clairvue/types';
import { normalizeError } from '@/utils';

async function create(newArticles: NewArticle | NewArticle[]): Promise<Result<string[], Error>> {
  const db = getClient();
  const { randomUUID } = new ShortUniqueId({ length: 8 });

  const toCreate = Array.isArray(newArticles)
    ? newArticles.map((article) => ({ id: randomUUID(), slug: randomUUID(), ...article }))
    : [{ id: randomUUID(), slug: randomUUID(), ...newArticles }];

  try {
    const result = await db
      .insert(articleSchema)
      .values(toCreate)
      .onConflictDoNothing()
      .returning({
        slug: articleSchema.slug
      })
      .execute();

    if (!result || result.length === 0) return Result.err(new Error('Failed to create article'));

    return Result.ok(result.map((r) => r.slug));
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while creating article:', error);
    return Result.err(error);
  }
}

async function findBySlug(slug: string): Promise<Result<Article | false, Error>> {
  try {
    const db = getClient();
    const result = await db
      .select()
      .from(articleSchema)
      .where(eq(articleSchema.slug, slug))
      .execute();
    if (!result || result.length === 0) return Result.ok(false);
    return Result.ok(result[0]);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding Article by slug:', error);
    return Result.err(error);
  }
}

async function existsWithLink(link: string): Promise<Result<boolean, Error>> {
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
    return Result.ok(exists);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding Article by link:', error);
    return Result.err(error);
  }
}

async function findByFeedId(
  feedId: string,
  beforePublishedAt: string = new Date().toISOString(),
  take = 5
): Promise<Result<PaginatedList<Article> | false, Error>> {
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

    if (!result || result.length === 0) return Result.ok(false);

    return Result.ok({
      items: result,
      totalCount: result.length
    });
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding Articles by feedId:', error);
    return Result.err(error);
  }
}

async function findByCollectionId(
  collectionId: string,
  beforePublishedAt: string = new Date().toISOString(),
  take = 5
): Promise<Result<PaginatedList<ArticleWithFeed> | false, Error>> {
  try {
    const db = getClient();

    // Check if the collectionId exists
    const collectionExists = await db
      .select()
      .from(collectionSchema)
      .where(eq(collectionSchema.id, collectionId))
      .execute();

    if (!collectionExists || collectionExists.length === 0) {
      return Result.ok(false);
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
          slug: feedSchema.slug,
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
      .leftJoin(collectionsToFeeds, eq(feedSchema.id, collectionsToFeeds.feedId))
      .where(
        and(
          eq(collectionsToFeeds.collectionId, collectionId),
          lt(articleSchema.publishedAt, new Date(beforePublishedAt))
        )
      )
      .orderBy(desc(articleSchema.publishedAt))
      .limit(take)
      .execute();

    if (!queryResult || queryResult.length === 0) {
      return Result.ok(false);
    }

    return Result.ok({
      items: queryResult.map((r) => ({
        ...r,
        description: r.description ?? undefined,
        image: r.image ?? undefined,
        author: r.author ?? undefined,
        feed: r.feed ?? undefined
      })),
      totalCount: queryResult.length
    });
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding Articles by collectionId:', error);
    return Result.err(error);
  }
}

async function countArticles(
  afterPublishedAt: Date,
  feedId?: string,
  collectionId?: string
): Promise<Result<number, Error>> {
  try {
    const db = getClient();

    const articleCount = await db
      .select({ count: sql<number>`cast(${count(articleSchema.id)} as int)` })
      .from(articleSchema)
      .leftJoin(feedSchema, eq(articleSchema.feedId, feedSchema.id))
      .leftJoin(collectionsToFeeds, eq(feedSchema.id, collectionsToFeeds.feedId))
      .where(
        and(
          collectionId ? eq(collectionsToFeeds.collectionId, collectionId) : undefined,
          feedId ? eq(collectionsToFeeds.feedId, feedId) : undefined,
          gt(articleSchema.publishedAt, afterPublishedAt)
        )
      )
      .execute();

    if (!articleCount || articleCount.length === 0) return Result.ok(0);

    return Result.ok(articleCount[0].count);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting article count:', error);
    return Result.err(error);
  }
}

export default {
  create,
  findBySlug,
  existsWithLink,
  findByFeedId,
  findByCollectionId,
  countArticles
};
