import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import {
  articleSchema,
  collectionsToFeeds,
  articlesToFeeds,
  feedSchema,
  userArticleInteractions
} from '../schema';
import { count, desc, eq, lt, sql, and, like, gt } from 'drizzle-orm';
import { Result } from '@clairvue/types';
import type { Article, ArticleWithInteraction, NewArticle, PaginatedList } from '@clairvue/types';
import { normalizeError } from '$lib/utils';

async function create(
  newArticles: NewArticle | NewArticle[],
  feedId: string
): Promise<Result<string[], Error>> {
  try {
    const db = getClient();
    const { randomUUID } = new ShortUniqueId({ length: 8 });

    const toCreate = Array.isArray(newArticles)
      ? newArticles.map((article) => ({ id: randomUUID(), slug: randomUUID(), ...article }))
      : [{ id: randomUUID(), slug: randomUUID(), ...newArticles }];

    const result = await db
      .insert(articleSchema)
      .values(toCreate)
      .onConflictDoNothing()
      .returning({
        id: articleSchema.id,
        slug: articleSchema.slug
      })
      .execute();

    const articleFeedRelations = result.map((article) => ({
      articleId: article.id,
      feedId
    }));

    await db.insert(articlesToFeeds).values(articleFeedRelations).execute();

    if (!result || result.length === 0) return Result.err(new Error('Failed to create article'));

    return Result.ok(result.map((r) => r.slug));
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while creating article:', error);
    return Result.err(error);
  }
}

async function getSavedArticlesFeedId(userId: string): Promise<Result<string, Error>> {
  try {
    const db = getClient();
    const result = await db
      .select({ id: feedSchema.id })
      .from(feedSchema)
      .innerJoin(collectionsToFeeds, and(eq(feedSchema.id, collectionsToFeeds.feedId), eq(collectionsToFeeds.userId, userId)))
      .where(like(feedSchema.link, 'default-feed-%'))
      .execute();
    return Result.ok(result[0].id);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting saved articles feed id:', error);
    return Result.err(error);
  }
}

async function addToSavedArticles(articleId: string, userId: string): Promise<Result<true, Error>> {
  try {
    const db = getClient();

    const savedArticlesFeedIdResult = await getSavedArticlesFeedId(userId);

    if (savedArticlesFeedIdResult.isErr()) return savedArticlesFeedIdResult;

    const savedArticlesFeedId = savedArticlesFeedIdResult.unwrap();

    const articleFeedRelations = { articleId, feedId: savedArticlesFeedId };

    const result = await db
      .insert(articlesToFeeds)
      .values(articleFeedRelations)
      .onConflictDoNothing()
      .returning({ id: articlesToFeeds.articleId })
      .execute();

    if (!result || result.length === 0)
      return Result.err(new Error('Failed to add article to saved articles'));

    const userInteractionResult = await db
      .insert(userArticleInteractions)
      .values({ articleId, userId, saved: true })
      .onConflictDoUpdate({
        target: [userArticleInteractions.articleId, userArticleInteractions.userId],
        set: { saved: true }
      })
      .returning({ id: userArticleInteractions.articleId })
      .execute();

    if (!userInteractionResult || userInteractionResult.length === 0)
      return Result.err(new Error('Failed to add article to saved articles'));

    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while adding article to saved articles:', error);
    return Result.err(error);
  }
}

async function removeFromSavedArticles(
  articleId: string,
  userId: string
): Promise<Result<true, Error>> {
  try {
    const db = getClient();

    const savedArticlesFeedIdResult = await getSavedArticlesFeedId(userId);

    if (savedArticlesFeedIdResult.isErr()) return savedArticlesFeedIdResult;

    const savedArticlesFeedId = savedArticlesFeedIdResult.unwrap();

    const result = await db
      .delete(articlesToFeeds)
      .where(and(eq(articlesToFeeds.articleId, articleId), eq(articlesToFeeds.feedId, savedArticlesFeedId)))
      .returning({ id: articlesToFeeds.articleId });

    const userInteractionResult = await db
      .update(userArticleInteractions)
      .set({ saved: false })
      .where(and(eq(userArticleInteractions.articleId, articleId), eq(userArticleInteractions.userId, userId)))
      .returning({ id: userArticleInteractions.articleId })
      .execute();

    if (!result || result.length === 0)
      return Result.err(new Error('Failed to remove article from saved articles'));

    if (!userInteractionResult || userInteractionResult.length === 0)
      return Result.err(new Error('Failed to remove article from saved articles'));

    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while removing article from saved articles:', error);
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
      .innerJoin(
        articlesToFeeds,
        and(eq(articleSchema.id, articlesToFeeds.articleId), eq(articlesToFeeds.feedId, feedId))
      )
      .where(lt(articleSchema.publishedAt, new Date(beforePublishedAt)))
      .orderBy(desc(articleSchema.publishedAt))
      .limit(take)
      .execute();

    if (!result || result.length === 0) return Result.ok(false);

    return Result.ok({
      items: result.map((r) => r.articles),
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
      .innerJoin(
        articlesToFeeds,
        and(eq(articleSchema.id, articlesToFeeds.articleId), eq(articlesToFeeds.feedId, feedId))
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
  afterPublishedAt: Date = new Date()
): Promise<Result<number, Error>> {
  try {
    const db = getClient();
    const result = await db
      .select({ count: sql<number>`cast(${count(articlesToFeeds.articleId)} as int)` })
      .from(articlesToFeeds)
      .innerJoin(articleSchema, eq(articlesToFeeds.articleId, articleSchema.id))
      .where(
        and(eq(articlesToFeeds.feedId, feedId), gt(articleSchema.publishedAt, afterPublishedAt))
      )
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
  afterPublishedAt: Date = new Date()
): Promise<Result<number, Error>> {
  try {
    const db = getClient();
    const result = await db
      .select({ count: sql<number>`cast(${count(articlesToFeeds.articleId)} as int)` })
      .from(articlesToFeeds)
      .innerJoin(collectionsToFeeds, eq(articlesToFeeds.feedId, collectionsToFeeds.feedId))
      .innerJoin(articleSchema, eq(articlesToFeeds.articleId, articleSchema.id))
      .where(
        and(
          eq(collectionsToFeeds.collectionId, collectionId),
          gt(articleSchema.publishedAt, afterPublishedAt)
        )
      )
      .execute();
    return Result.ok(result[0].count);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while counting Articles by collectionId:', error);
    return Result.err(error);
  }
}

export default {
  create,
  addToSavedArticles,
  removeFromSavedArticles,
  findBySlug,
  existsByLink,
  findByFeedId,
  findByFeedIdWithInteractions,
  countArticlesByFeedId,
  countArticlesByCollectionId
};
