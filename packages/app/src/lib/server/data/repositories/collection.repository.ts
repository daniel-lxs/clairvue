import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import {
  collectionSchema,
  feedSchema,
  collectionsToFeeds,
  type Collection,
  type Feed,
  type CollectionWithFeeds
} from '../schema';
import { and, eq, like } from 'drizzle-orm';
import slugify from 'slugify';
import feedRepository from './feed.repository';

async function insert(name: string, userId: string, id?: string) {
  //TODO: Limit the number of collections per user to 5

  const hasDefaultCollection = id?.includes('default-') && (await findDefaultByUserId(userId));

  if (hasDefaultCollection) {
    throw new Error('Default collection already exists');
  }

  const db = getClient();
  const { randomUUID } = new ShortUniqueId({ length: 8 });

  const gotId = id ?? randomUUID();

  const slug = slugify(name, {
    lower: true,
    remove: /[*+~.()'"!:@]/g
  });

  const result = await db
    .insert(collectionSchema)
    .values({
      name,
      userId,
      id: gotId,
      slug
    })
    .returning({
      id: collectionSchema.id,
      name: collectionSchema.name,
      slug: collectionSchema.slug,
      createdAt: collectionSchema.createdAt,
      updatedAt: collectionSchema.updatedAt
    })
    .execute();

  if (result && result.length > 0) {
    return result[0] as Collection;
  }

  throw new Error('Unknown error occurred while creating new collection');
}

async function create({ name, userId }: Pick<Collection, 'name' | 'userId'>) {
  if (!name || !userId) throw new Error('Invalid name or userId');
  return await insert(name, userId);
}

async function createDefault({ name, userId }: Pick<Collection, 'name' | 'userId'>) {
  if (!name || !userId) throw new Error('Invalid name or userId');
  const { randomUUID } = new ShortUniqueId({ length: 8 });

  const id = 'default-' + randomUUID();
  return await insert(name, userId, id);
}

async function update(id: string, newCollection: Pick<Collection, 'name'>) {
  const db = getClient();
  await db
    .update(collectionSchema)
    .set({
      ...newCollection
    })
    .where(eq(collectionSchema.id, id))
    .execute();
}

async function addFeedsToCollection(assignments: { id: string; feedId: string }[]) {
  const db = getClient();

  const collection = await db.query.collectionSchema
    .findFirst({ where: eq(collectionSchema.id, assignments[0].id) })
    .execute();

  if (!collection) throw new Error('Collection does not exist');

  const validAssignments = await Promise.all(
    assignments.map(async ({ id, feedId }) => {
      const feedExists = await db.query.feedSchema
        .findFirst({ where: eq(feedSchema.id, feedId) })
        .execute();

      if (!feedExists) return undefined;

      const isAlreadyRelated = await db.query.collectionsToFeeds
        .findFirst({
          where: and(eq(collectionsToFeeds.collectionId, id), eq(collectionsToFeeds.feedId, feedId))
        })
        .execute();

      if (isAlreadyRelated) return undefined;

      return {
        collectionId: id,
        feedId,
        userId: collection.userId
      };
    })
  );

  const filteredAssignments = validAssignments.filter((as) => !!as);

  await db.insert(collectionsToFeeds).values(filteredAssignments).execute();
}

async function findById(id: string): Promise<Collection | undefined> {
  try {
    const db = getClient();

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

async function findByIdWithFeeds(id: string): Promise<CollectionWithFeeds | undefined> {
  try {
    const db = getClient();
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
  } catch (error) {
    console.error('Error occurred while finding Collection by slug:', error);
    return undefined;
  }
}

async function findBySlug(slug: string, userId: string): Promise<Collection | undefined> {
  try {
    const db = getClient();
    const result = await db.query.collectionSchema
      .findFirst({
        where: and(eq(collectionSchema.userId, userId), eq(collectionSchema.slug, slug))
      })
      .execute();

    if (!result) return undefined;

    return result as Collection;
  } catch (error) {
    console.error('Error occurred while finding Collection by id:', error);
    return undefined;
  }
}

async function findBySlugWithFeeds(
  slug: string,
  userId: string
): Promise<CollectionWithFeeds | undefined> {
  try {
    const db = getClient();
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
  } catch (error) {
    console.error('Error occurred while finding Collections by userId:', error);
    return undefined;
  }
}

async function findByUserId(userId: string): Promise<Collection[] | undefined> {
  try {
    const db = getClient();
    const result = await db.query.collectionSchema.findMany({
      where: eq(collectionSchema.userId, userId)
    });
    if (!result || result.length === 0) return undefined;

    return result;
  } catch (error) {
    console.error('Error occurred while finding Collection by user id:', error);
    return undefined;
  }
}

async function findByUserIdWithFeeds(userId: string): Promise<CollectionWithFeeds[] | undefined> {
  const db = getClient();
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
      const feeds = await Promise.all(collection.collectionsToFeeds?.map(async (e) => e.feed));
      return {
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        userId: collection.userId,
        feeds: feeds ?? []
      };
    })
  );

  return processedCollections;
}

async function findDefaultByUserId(userId: string): Promise<Collection | undefined> {
  try {
    const db = getClient();
    const result = await db.query.collectionSchema
      .findFirst({
        where: and(eq(collectionSchema.userId, userId), like(collectionSchema.id, 'default-%'))
      })
      .execute();
    return result as Collection;
  } catch (error) {
    console.error('Error occurred while finding Collection by user id:', error);
    return undefined;
  }
}

async function findDefaultByUserIdWithFeeds(
  userId: string
): Promise<CollectionWithFeeds | undefined> {
  try {
    const db = getClient();
    const result = await db.query.collectionSchema.findFirst({
      where: and(eq(collectionSchema.userId, userId), like(collectionSchema.id, 'default-%')),
      with: {
        collectionsToFeeds: {
          columns: {},
          with: {
            feed: true
          }
        }
      }
    });

    if (!result) return undefined;

    const feeds = result.collectionsToFeeds?.map((b) => b.feed) || [];

    return {
      id: result.id,
      slug: result.slug,
      name: result.name,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      userId: result.userId,
      feeds
    };
  } catch (error) {
    console.error('Error occurred while finding Collection by user id:', error);
    return undefined;
  }
}

//delete is a ts keyword
async function removeFeedFromCollection(id: string, feedId: string) {
  const feed = await feedRepository.findById(feedId);
  if (feed?.link.startsWith('default-feed-') && id.includes('default-')) {
    throw 'Cannot remove default feed from default collection';
  }

  const db = getClient();

  await db
    .delete(collectionsToFeeds)
    .where(and(eq(collectionsToFeeds.collectionId, id), eq(collectionsToFeeds.feedId, feedId)))
    .execute();
}

export default {
  create,
  createDefault,
  update,
  findById,
  findByIdWithFeeds,
  findBySlug,
  findBySlugWithFeeds,
  findByUserId,
  findByUserIdWithFeeds,
  addFeedsToCollection,
  findDefaultByUserId,
  findDefaultByUserIdWithFeeds,
  removeFeedFromCollection
};
