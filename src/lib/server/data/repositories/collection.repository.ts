import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import { collectionSchema, feedSchema, collectionsToFeeds, type Collection } from '../schema';
import { and, eq, like } from 'drizzle-orm';
import slugify from 'slugify';

async function create(newCollection: Pick<Collection, 'name' | 'userId'> & { default?: boolean }) {
  //TODO: Limit the number of collections per user to 5
  try {
    const db = getClient();
    const { randomUUID } = new ShortUniqueId({ length: 8 });

    const id = (newCollection.default ? 'default-' : '') + randomUUID();
    const slug = slugify(newCollection.name, {
      lower: true,
      remove: /[*+~.()'"!:@]/g
    });

    await db
      .insert(collectionSchema)
      .values({
        ...newCollection,
        id,
        slug
      })
      .execute();
    return {
      id,
      name: newCollection.name,
      slug
    };
  } catch (error) {
    console.error('Error occurred while creating new Collection:', error);
    return undefined;
  }
}

async function update(id: string, newCollection: Pick<Collection, 'name'>) {
  try {
    const db = getClient();
    await db
      .update(collectionSchema)
      .set({
        ...newCollection
      })
      .where(eq(collectionSchema.id, id))
      .execute();
  } catch (error) {
    console.error('Error occurred while updating Collection:', error);
    throw error;
  }
}

async function addFeedsToCollection(assignments: { id: string; feedId: string }[]) {
  try {
    const db = getClient();

    for (const { id, feedId } of assignments) {
      const feedExists = await db.query.feedSchema
        .findFirst({ where: eq(feedSchema.id, feedId) })
        .execute();

      if (!feedExists) {
        throw new Error('Feed does not exist');
      }

      const isAlreadyRelated = await db.query.collectionsToFeeds
        .findFirst({
          where: and(eq(collectionsToFeeds.collectionId, id), eq(collectionsToFeeds.feedId, feedId))
        })
        .execute();

      if (!isAlreadyRelated) {
        await db
          .insert(collectionsToFeeds)
          .values({
            collectionId: id,
            feedId
          })
          .execute();
      }
    }
  } catch (error) {
    console.error('Error occurred while adding feeds to collection:', error);
    throw error;
  }
}

async function findById(id: string, withRelated: boolean = false): Promise<Collection | undefined> {
  try {
    const db = getClient();

    if (withRelated) {
      const result = await db
        .select()
        .from(collectionSchema)
        .leftJoin(collectionsToFeeds, eq(collectionsToFeeds.collectionId, collectionSchema.id))
        .leftJoin(feedSchema, eq(collectionsToFeeds.feedId, feedSchema.id))
        .where(eq(collectionSchema.id, id))
        .execute();

      if (!result || result.length === 0) return undefined;

      const feeds = result.map((r) => (r.feeds ? [r.feeds] : []));

      return {
        ...result[0].collections,
        feeds: feeds.flat()
      };
    }

    const result = await db.query.collectionSchema
      .findFirst({
        where: eq(collectionSchema.id, id)
      })
      .execute();

    if (result) return undefined;

    return result;
  } catch (error) {
    console.error('Error occurred while finding Collection by id:', error);
    return undefined;
  }
}

async function findBySlug(
  userId: string,
  slug: string,
  withRelated: boolean = false
): Promise<Collection | undefined> {
  try {
    const db = getClient();

    if (withRelated) {
      const result = await db
        .select()
        .from(collectionSchema)
        .leftJoin(collectionsToFeeds, eq(collectionsToFeeds.collectionId, collectionSchema.id))
        .leftJoin(feedSchema, eq(collectionsToFeeds.feedId, feedSchema.id))
        .where(and(eq(collectionSchema.userId, userId), eq(collectionSchema.slug, slug)))
        .execute();

      if (!result || result.length === 0) return undefined;

      const feeds = result.map((r) => (r.feeds ? [r.feeds] : []));

      return {
        ...result[0].collections,
        feeds: feeds.flat()
      };
    }

    const result = await db.query.collectionSchema
      .findFirst({
        where: and(eq(collectionSchema.userId, userId), eq(collectionSchema.slug, slug))
      })
      .execute();

    if (!result) return undefined;

    return result;
  } catch (error) {
    console.error('Error occurred while finding Collection by id:', error);
    return undefined;
  }
}

async function findCollectionsByUserId(
  userId: string,
  withRelated: boolean = false
): Promise<Collection[] | undefined> {
  try {
    const db = getClient();

    if (withRelated) {
      const result = await db.query.collectionSchema.findMany({
        where: eq(collectionSchema.userId, userId),
        with: {
          collectionsToFeeds: {
            columns: {},
            with: {
              feed: true
            }
          }
        }
      });

      if (!result || result.length === 0) return undefined;

      const processedCollections = await Promise.all(
        result.map(async (collection) => {
          const feeds = await Promise.all(
            collection.collectionsToFeeds?.map(async (b) => b.feed) || []
          );
          return {
            id: collection.id,
            slug: collection.slug,
            name: collection.name,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
            userId: collection.userId,
            feeds
          };
        })
      );

      return processedCollections;
    }
    const result = await db
      .select()
      .from(collectionSchema)
      .where(eq(collectionSchema.userId, userId))
      .execute();

    if (!result || result.length === 0) return undefined;
  } catch (error) {
    console.error('Error occurred while finding Collection by user id:', error);
    return [];
  }
}

async function findDefaultCollection(userId: string): Promise<Collection | undefined> {
  try {
    const db = getClient();
    const result = await db.query.collectionSchema
      .findFirst({
        where: and(eq(collectionSchema.userId, userId), like(collectionSchema.id, 'default-%'))
      })
      .execute();
    return result;
  } catch (error) {
    console.error('Error occurred while finding Collection by user id:', error);
    return undefined;
  }
}

async function deleteFeedFromCollection(collectionId: string, feedId: string) {
  try {
    const db = getClient();
    await db
      .delete(collectionsToFeeds)
      .where(
        and(
          eq(collectionsToFeeds.collectionId, collectionId),
          eq(collectionsToFeeds.feedId, feedId)
        )
      )
      .execute();
  } catch (error) {
    console.error('Error occurred while deleting feed:', error);
    throw error;
  }
}

export default {
  create,
  update,
  findById,
  findBySlug,
  findCollectionsByUserId,
  addFeedsToCollection,
  deleteFeedFromCollection,
  findDefaultCollection
};
