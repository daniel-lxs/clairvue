import { and, count, desc, eq, sql } from 'drizzle-orm';
import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import { boardsToFeeds, feedSchema, type Feed, articleSchema } from '../schema';
import slugify from 'slugify';

async function create(
  newFeed: Pick<Feed, 'name' | 'description' | 'link'>
): Promise<Feed | undefined> {
  try {
    const db = getClient();

    const existingFeed = await findByLink(newFeed.link);

    if (existingFeed) {
      const articleCount = await countArticles(existingFeed.id);
      return { ...existingFeed, articleCount };
    }

    const { randomUUID } = new ShortUniqueId({ length: 8 });
    const id = randomUUID();
    const slug = slugify(newFeed.name, {
      lower: true,
      remove: /[*+~.()'"!:@]/g
    });

    const result = (
      await db
        .insert(feedSchema)
        .values({
          id,
          name: newFeed.name,
          slug,
          description: newFeed.description,
          link: newFeed.link
        })
        .returning({
          id: feedSchema.id,
          name: feedSchema.name,
          slug: feedSchema.slug,
          description: feedSchema.description,
          link: feedSchema.link,
          createdAt: feedSchema.createdAt,
          updatedAt: feedSchema.updatedAt,
          syncedAt: feedSchema.syncedAt
        })
        .execute()
    )[0];

    return result;
  } catch (error) {
    console.error('Error occurred while creating new feed:', error);
    return undefined;
  }
}

async function findById(id: string): Promise<Feed | undefined> {
  try {
    const db = getClient();
    const result = await db.query.feedSchema.findFirst({ where: eq(feedSchema.id, id) }).execute();

    if (!result) return undefined;

    const articleCount = await countArticles(id);

    return {
      ...result,
      articleCount
    };
  } catch (error) {
    console.error('Error occurred while finding feed by link:', error);
    return undefined;
  }
}

async function findBySlug(slug: string): Promise<Feed | undefined> {
  try {
    const db = getClient();
    const result = await db.query.feedSchema
      .findFirst({ where: eq(feedSchema.slug, slug) })
      .execute();
    return result;
  } catch (error) {
    console.error('Error occurred while finding feed by slug:', error);
    return undefined;
  }
}

async function findByLink(link: string): Promise<Feed | undefined> {
  try {
    const db = getClient();
    const result = await db.select().from(feedSchema).where(eq(feedSchema.link, link)).execute();

    const Feed = result[0];
    if (!Feed) return undefined;

    return Feed;
  } catch (error) {
    console.error('Error occurred while finding feed by link:', error);
    return undefined;
  }
}

async function findAll(take = 20, skip = 0): Promise<Feed[]> {
  try {
    const db = getClient();

    take = take > 100 ? 100 : take;

    const result = await db.query.feedSchema
      .findMany({
        offset: skip,
        limit: take,
        orderBy: desc(feedSchema.createdAt)
      })
      .execute();
    return result;
  } catch (error) {
    console.error('Error occurred while finding all feeds:', error);
    return [];
  }
}

//TODO: drizzle has a bug where it won't return anything if more than a day has passed
async function findOutdated(take = 20, skip = 0): Promise<Feed[]> {
  try {
    const MAX_AGE = 10 * 60 * 1000; // 10 minutes
    take = take > 100 ? 100 : take;
    const db = getClient();

    const outdatedDate = new Date(Date.now() - MAX_AGE).toISOString();

    const query = sql`
      SELECT *
      FROM ${feedSchema}
      WHERE
        ${feedSchema.syncedAt} < ${outdatedDate}
        AND ${feedSchema.link} NOT LIKE 'default-feed%'
      ORDER BY ${feedSchema.syncedAt}
      LIMIT ${take}
      OFFSET ${skip}
    `;

    const result: Feed[] = await db.execute(query);

    return result;
  } catch (error) {
    console.error('Error occurred while finding all outdated feeds:', error);
    return [];
  }
}

async function countArticles(id: string): Promise<number | undefined> {
  try {
    const db = getClient();
    const [result] = await db
      .select({ count: count() })
      .from(articleSchema)
      .where(eq(articleSchema.feedId, id))
      .execute();
    return result.count;
  } catch (error) {
    console.error('Error occurred while getting article count:', error);
    return undefined;
  }
}

async function update(id: string, updatedFeed: Pick<Feed, 'name' | 'description' | 'link'>) {
  try {
    const db = getClient();
    const currentDate = new Date();
    await db
      .update(feedSchema)
      .set({
        ...updatedFeed,
        updatedAt: currentDate
      })
      .where(eq(feedSchema.id, id)).execute;
  } catch (error) {
    console.error('Error occurred while updating feed:', error);
    throw error;
  }
}

async function updateLastSync(id: string) {
  try {
    const db = getClient();
    await db
      .update(feedSchema)
      .set({
        syncedAt: new Date()
      })
      .where(eq(feedSchema.id, id))
      .execute();
  } catch (error) {
    console.error('Error occurred while updating feed:', error);
    throw error;
  }
}

//delete is a ts keyword
async function remove(id: string, boardId: string) {
  try {
    // Check if it's a default feed
    const feed = await findById(id);
    if (feed?.link.startsWith('default-feed-')) {
      throw 'Cannot delete default feed';
    }

    const db = getClient();

    await db
      .delete(boardsToFeeds)
      .where(and(eq(boardsToFeeds.boardId, boardId), eq(boardsToFeeds.feedId, id)))
      .execute();
  } catch (error) {
    console.error('Error occurred while deleting feed:', error);
    throw new Error('Failed to delete feed', { cause: error });
  }
}

export default {
  create,
  findById,
  findBySlug,
  findByLink,
  findAll,
  findOutdated,
  countArticles,
  update,
  updateLastSync,
  remove
};
