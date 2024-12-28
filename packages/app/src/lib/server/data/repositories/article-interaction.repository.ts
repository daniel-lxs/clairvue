import { Result, type UserArticleInteraction } from '@clairvue/types';
import { getClient } from '../db';
import { userArticleInteractions } from '../schema';
import { and, eq } from 'drizzle-orm';

async function create(
  userId: string,
  articleId: string,
  interaction: UserArticleInteraction
): Promise<Result<UserArticleInteraction, Error>> {
  const db = getClient();
  const result = await db
    .insert(userArticleInteractions)
    .values({ userId, articleId, ...interaction })
    .returning()
    .execute();
  return Result.ok({
    read: result[0].read,
    saved: result[0].saved
  });
};

async function find(userId: string, articleId: string): Promise<Result<UserArticleInteraction, Error>> {
  const db = getClient();
  const result = await db
    .select()
    .from(userArticleInteractions)
    .where(and(eq(userArticleInteractions.userId, userId), eq(userArticleInteractions.articleId, articleId)))
    .execute();
  return Result.ok({
    read: result[0].read,
    saved: result[0].saved
  });
}

async function update(
  userId: string,
  articleId: string,
  interaction: UserArticleInteraction
): Promise<Result<UserArticleInteraction, Error>> {
  const db = getClient();
  const result = await db
    .update(userArticleInteractions)
    .set({ ...interaction })
    .where(and(eq(userArticleInteractions.userId, userId), eq(userArticleInteractions.articleId, articleId)))
    .returning()
    .execute();
  return Result.ok({
    read: result[0].read,
    saved: result[0].saved
  });
}



export default {
  create,
  find,
  update
};
