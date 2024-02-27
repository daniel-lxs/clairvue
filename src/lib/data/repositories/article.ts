import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import { articleSchema, type Article } from '../schema';
import { eq } from 'drizzle-orm';
import type { NewArticle } from '@/types/NewArticle';

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

export default {
  create,
  findById,
  findByLink,
  findByRssFeedId
};
