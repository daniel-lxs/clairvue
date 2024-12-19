import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import {
  articleSchema,
  collectionsToFeeds,
  userArticleInteractions,
  collectionSchema,
  feedSchema
} from '../schema';
import { count, desc, eq, lt, sql, and, gt } from 'drizzle-orm';
import { Result } from '@clairvue/types';
import type {
  Article,
  ArticleWithFeed,
  ArticleWithInteraction,
  NewArticle,
  PaginatedList
} from '@clairvue/types';
import { normalizeError } from '$lib/utils';

async function create(
  newArticles: NewArticle | NewArticle[],
  feedId: string
): Promise<Result<string[], Error>> {
  try {
    const db = getClient();
    const { randomUUID } = new ShortUniqueId({ length: 8 });

    const toCreate = Array.isArray(newArticles)
      ? newArticles.map((article) => ({
          id: randomUUID(),
          slug: randomUUID(),
          feedId,
          ...article
        }))
      : [
          {
            id: randomUUID(),
            slug: randomUUID(),
            feedId,
            ...newArticles
          }
        ];

    const result = await db.transaction(async (tx) => {
      const insertedArticles = await tx
        .insert(articleSchema)
        .values(toCreate)
        .onConflictDoNothing()
        .returning({
          id: articleSchema.id,
          slug: articleSchema.slug
        })
        .execute();

      if (!insertedArticles || insertedArticles.length === 0) {
        return Result.err(new Error('Failed to create article'));
      }

      return Result.ok(insertedArticles.map((r) => r.slug));
    });

    return result;
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while creating article:', error);
    return Result.err(error);
  }
}

async function updateInteractions(
  userId: string,
  articleId: string,
  read?: boolean,
  saved?: boolean
): Promise<Result<true, Error>> {
  try {
    const db = getClient();
    const result = await db
      .insert(userArticleInteractions)
      .values({
        userId,
        articleId,
        read,
        saved
      })
      .onConflictDoUpdate({
        target: [userArticleInteractions.userId, userArticleInteractions.articleId],
        set: {
          updatedAt: new Date(),
          read,
          saved
        }
      })
      .returning()
      .execute();

    if (!result || result.length === 0)
      return Result.err(new Error('Failed to update interactions'));

    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while updating interactions:', error);
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

async function existsByLink(link: string): Promise<Result<boolean, Error>> {
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
    const result = await db
      .select()
      .from(articleSchema)
      .where(
        and(
          eq(articleSchema.feedId, feedId),
          lt(articleSchema.publishedAt, new Date(beforePublishedAt))
        )
      )
      .orderBy(desc(articleSchema.publishedAt))
      .limit(take)
      .execute();

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

async function findByFeedIdWithInteractions(
  feedId: string,
  userId: string,
  beforePublishedAt: string = new Date().toISOString(),
  take = 5
): Promise<Result<PaginatedList<ArticleWithInteraction> | false, Error>> {
  try {
    const db = getClient();
    const result = await db
      .select({
        article: articleSchema,
        interaction: userArticleInteractions
      })
      .from(articleSchema)
      .leftJoin(
        userArticleInteractions,
        and(
          eq(articleSchema.id, userArticleInteractions.articleId),
          eq(userArticleInteractions.userId, userId)
        )
      )
      .where(
        and(
          eq(articleSchema.feedId, feedId),
          lt(articleSchema.publishedAt, new Date(beforePublishedAt))
        )
      )
      .orderBy(desc(articleSchema.publishedAt))
      .limit(take)
      .execute();

    if (!result || result.length === 0) return Result.ok(false);

    return Result.ok({
      items: result.map((r) => ({
        ...r.article,
        read: r.interaction?.read ?? false,
        saved: r.interaction?.saved ?? false
      })),
      totalCount: result.length
    });
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding Articles by feedId:', error);
    return Result.err(error);
  }
}

async function countArticlesByFeedId(
  feedId: string,
  afterPublishedAt?: string
): Promise<Result<number, Error>> {
  try {
    const db = getClient();
    const whereClause = afterPublishedAt
      ? and(
          eq(articleSchema.feedId, feedId),
          lt(articleSchema.publishedAt, new Date(afterPublishedAt))
        )
      : eq(articleSchema.feedId, feedId);

    const result = await db
      .select({ count: sql<number>`cast(${count(articleSchema.id)} as int)` })
      .from(articleSchema)
      .where(whereClause)
      .execute();
    return Result.ok(result[0].count);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while counting Articles by feedId:', error);
    return Result.err(error);
  }
}

async function countArticlesByCollectionId(
  collectionId: string,
  afterPublishedAt: string = new Date().toISOString()
): Promise<Result<number, Error>> {
  try {
    const db = getClient();
    const result = await db
      .select({ count: sql<number>`cast(${count(articleSchema.id)} as int)` })
      .from(articleSchema)
      .innerJoin(
        collectionsToFeeds,
        and(
          eq(articleSchema.feedId, collectionsToFeeds.feedId),
          eq(collectionsToFeeds.collectionId, collectionId)
        )
      )
      .where(gt(articleSchema.publishedAt, new Date(afterPublishedAt)))
      .execute();
    return Result.ok(result[0].count);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while counting Articles by collectionId:', error);
    return Result.err(error);
  }
}

async function findByCollectionId(
  collectionId: string,
  beforePublishedAt: string = new Date().toISOString(),
  take: number
): Promise<Result<PaginatedList<ArticleWithFeed> | false, Error>> {
  try {
    const db = getClient();

    const articles = await db
      .select()
      .from(articleSchema)
      .innerJoin(feedSchema, eq(articleSchema.feedId, feedSchema.id))
      .innerJoin(
        collectionsToFeeds,
        and(
          eq(feedSchema.id, collectionsToFeeds.feedId),
          eq(collectionsToFeeds.collectionId, collectionId)
        )
      )

      .where(
        and(
          eq(collectionSchema.id, collectionId),
          lt(articleSchema.publishedAt, new Date(beforePublishedAt))
        )
      )
      .orderBy(desc(articleSchema.publishedAt))
      .limit(take)
      .execute();

    if (!articles || articles.length === 0) return Result.ok(false);

    // Extract the article data from the joined result
    const extractedArticles = articles.map((result) => ({
      ...result.articles,
      feed: result.feeds
    }));

    const totalCount = await countArticlesByCollectionId(collectionId, beforePublishedAt);

    if (totalCount.isErr()) return Result.err(totalCount.unwrapErr());

    return Result.ok({
      items: extractedArticles,
      totalCount: totalCount.unwrap()
    });
  } catch (e) {
    const error = normalizeError(e);
    console.error(
      'Error occurred while finding articles by collection and before published date:',
      error
    );
    return Result.err(error);
  }
}

async function findByCollectionIdWithInteractions(
  collectionId: string,
  userId: string,
  beforePublishedAt: string = new Date().toISOString(),
  take: number
): Promise<Result<PaginatedList<ArticleWithInteraction> | false, Error>> {
  try {
    const db = getClient();

    const articles = await db
      .select({
        article: articleSchema,
        interaction: userArticleInteractions
      })
      .from(articleSchema)
      .innerJoin(feedSchema, eq(articleSchema.feedId, feedSchema.id))
      .innerJoin(
        collectionsToFeeds,
        and(
          eq(feedSchema.id, collectionsToFeeds.feedId),
          eq(collectionsToFeeds.collectionId, collectionId)
        )
      )
      .leftJoin(
        userArticleInteractions,
        and(
          eq(articleSchema.id, userArticleInteractions.articleId),
          eq(userArticleInteractions.userId, userId)
        )
      )
      .where(lt(articleSchema.publishedAt, new Date(beforePublishedAt)))
      .orderBy(desc(articleSchema.publishedAt))
      .limit(take)
      .execute();

    if (!articles || articles.length === 0) return Result.ok(false);

    const items = articles.map((r) => ({
      ...r.article,
      read: r.interaction?.read ?? false,
      saved: r.interaction?.saved ?? false
    }));

    const totalCount = await countArticlesByCollectionId(collectionId, beforePublishedAt);

    if (totalCount.isErr()) return Result.err(totalCount.unwrapErr());

    return Result.ok({
      items,
      totalCount: totalCount.unwrap()
    });
  } catch (e) {
    const error = normalizeError(e);
    console.error(
      'Error occurred while finding articles with interactions by collection and before published date:',
      error
    );
    return Result.err(error);
  }
}

async function findSavedByUserId(
  userId: string,
  take: number = 20,
  skip: number = 0
): Promise<Result<ArticleWithInteraction[] | false, Error>> {
  try {
    const db = getClient();
    const result = await db
      .select()
      .from(articleSchema)
      .innerJoin(
        userArticleInteractions,
        and(
          eq(articleSchema.id, userArticleInteractions.articleId),
          eq(userArticleInteractions.userId, userId)
        )
      )
      .where(eq(userArticleInteractions.saved, true))
      .limit(take)
      .offset(skip)
      .orderBy(desc(userArticleInteractions.createdAt))
      .execute();

    if (!result || result.length === 0) return Result.ok(false);

    const articlesWithInteractions = result.map((r) => ({
      ...r.articles,
      read: r.userArticleInteractions.read,
      saved: r.userArticleInteractions.saved
    }));

    return Result.ok(articlesWithInteractions);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding saved articles by userId:', error);
    return Result.err(error);
  }
}

async function findUnreadByUserId(
  userId: string,
  take: number = 20,
  skip: number = 0
): Promise<Result<ArticleWithInteraction[] | false, Error>> {
  try {
    const db = getClient();

    const result = await db
      .select()
      .from(articleSchema)
      .innerJoin(
        userArticleInteractions,
        and(
          eq(articleSchema.id, userArticleInteractions.articleId),
          eq(userArticleInteractions.userId, userId)
        )
      )
      .where(eq(userArticleInteractions.read, false))
      .limit(take)
      .offset(skip)
      .execute();

    if (!result || result.length === 0) return Result.ok(false);

    const articlesWithInteractions = result.map((r) => ({
      ...r.articles,
      read: r.userArticleInteractions.read,
      saved: r.userArticleInteractions.saved
    }));

    return Result.ok(articlesWithInteractions);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding read articles by userId:', error);
    return Result.err(error);
  }
}

export default {
  create,
  findBySlug,
  existsByLink,
  findByFeedId,
  findByFeedIdWithInteractions,
  countArticlesByFeedId,
  countArticlesByCollectionId,
  findByCollectionId,
  findByCollectionIdWithInteractions,
  findSavedByUserId,
  findUnreadByUserId,
  updateInteractions
};
