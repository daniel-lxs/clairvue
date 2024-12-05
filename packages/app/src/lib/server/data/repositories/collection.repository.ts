import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import {
  collectionSchema,
  feedSchema,
  collectionsToFeeds,
  type Collection,
  type CollectionWithFeeds,
  type CollectionToFeeds
} from '../schema';
import { and, eq, like } from 'drizzle-orm';
import slugify from 'slugify';
import { Result } from '@clairvue/types';
import { normalizeError } from '@/utils';
import feedRepository from './feed.repository';
import type { AddFeedsToCollectionResult } from '@clairvue/types';

interface FeedAssignment {
  id: string;
  feedId: string;
}

async function validateFeedAssignment(
  assignment: FeedAssignment
): Promise<Result<CollectionToFeeds, Error>> {
  const db = getClient();

  try {
    const [collection, feed, existingRelation] = await Promise.all([
      db.query.collectionSchema.findFirst({ where: eq(collectionSchema.id, assignment.id) }),
      db.query.feedSchema.findFirst({ where: eq(feedSchema.id, assignment.feedId) }),
      db.query.collectionsToFeeds.findFirst({
        where: and(
          eq(collectionsToFeeds.collectionId, assignment.id),
          eq(collectionsToFeeds.feedId, assignment.feedId)
        )
      })
    ]);

    if (!collection) return Result.err(new Error(`Collection with id ${assignment.id} not found`));

    if (!feed) return Result.err(new Error(`Feed with id ${assignment.feedId} not found`));

    if (existingRelation)
      return Result.err(
        new Error(`Feed with id ${assignment.feedId} already exists in collection`)
      );

    return Result.ok({
      collectionId: assignment.id,
      feedId: assignment.feedId,
      userId: collection.userId
    });
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while validating feed assignment:', error);
    return Result.err(error);
  }
}

async function addFeedsToCollection(
  collectionId: string,
  feedIds: string[]
): Promise<Result<AddFeedsToCollectionResult, Error>> {
  const assignments = feedIds.map((feedId) => ({ id: collectionId, feedId }));

  const validationResults = await Promise.all(assignments.map((assignment) => validateFeedAssignment(assignment)));

  const collectionExists = await findById(collectionId);

  if (collectionExists.isOk() && !collectionExists.unwrap()) {
    return Result.err(new Error(`Collection with id ${collectionId} not found`));
  }

  const validationErrors = validationResults
    .filter((result) => result.isErr())
    .map((result) => result.unwrapErr());

  const validAssignments = validationResults.reduce<CollectionToFeeds[]>((acc, result) => {
    result.match({
      ok: (assignment) => (assignment ? acc.push(assignment) : null),
      err: () => {}
    });
    return acc;
  }, []);

  if (validAssignments.length === 0) {
    return Result.err(new Error('No valid assignments to process'));
  }

  const insertErrors = (
    await Promise.all(validAssignments.map((assignment) => insertCollectionToFeeds([assignment])))
  )
    .filter((result) => result.isErr())
    .map((result) => result.unwrapErr());

  return Result.ok({
    validationErrors,
    insertErrors
  });
}

async function insertCollectionToFeeds(
  collectionToFeeds: CollectionToFeeds[]
): Promise<Result<CollectionToFeeds[], Error>> {
  try {
    const db = getClient();
    const result = await db
      .insert(collectionsToFeeds)
      .values(collectionToFeeds)
      .returning()
      .execute();

    if (!result?.length) {
      return Result.err(new Error('Failed to add feeds to collection'));
    }

    return Result.ok(result);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while adding feeds to collection:', error);
    return Result.err(error);
  }
}

async function insert(
  name: string,
  userId: string,
  id?: string
): Promise<Result<Collection, Error>> {
  //TODO: Limit the number of collections per user to 5
  try {
    if (id?.includes('default-')) {
      const defaultCollection = (await findDefaultByUserId(userId)).unwrap();

      if (defaultCollection) {
        return Result.err(new Error('User already has a default collection'));
      }
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
        userId: collectionSchema.userId,
        createdAt: collectionSchema.createdAt,
        updatedAt: collectionSchema.updatedAt
      })
      .execute();

    if (!result || result.length === 0) {
      return Result.err(new Error('Unknown error occurred while creating new collection'));
    }

    return Result.ok(result[0]);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while creating collection:', error);
    return Result.err(error);
  }
}

async function create({
  name,
  userId
}: Pick<Collection, 'name' | 'userId'>): Promise<Result<Collection, Error>> {
  if (!name || !userId) return Result.err(new Error('Invalid name or userId'));
  return await insert(name, userId);
}

async function createDefault({
  name,
  userId
}: Pick<Collection, 'name' | 'userId'>): Promise<Result<Collection, Error>> {
  if (!name || !userId) return Result.err(new Error('Invalid name or userId'));
  const { randomUUID } = new ShortUniqueId({ length: 8 });

  const id = 'default-' + randomUUID();
  return await insert(name, userId, id);
}

async function update(
  id: string,
  newCollection: Pick<Collection, 'name'>
): Promise<Result<true, Error>> {
  try {
    const db = getClient();
    await db
      .update(collectionSchema)
      .set({
        ...newCollection
      })
      .where(eq(collectionSchema.id, id))
      .execute();

    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while updating collection:', error);
    return Result.err(error);
  }
}

async function findById(id: string): Promise<Result<Collection | false, Error>> {
  try {
    const db = getClient();

    const result = await db.query.collectionSchema
      .findFirst({
        where: eq(collectionSchema.id, id)
      })
      .execute();

    if (!result) return Result.ok(false);

    return Result.ok(result);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding Collection by id:', error);
    return Result.err(error);
  }
}

async function findByIdWithFeeds(id: string): Promise<Result<CollectionWithFeeds | false, Error>> {
  try {
    const db = getClient();
    const result = await db
      .select()
      .from(collectionSchema)
      .leftJoin(collectionsToFeeds, eq(collectionsToFeeds.collectionId, collectionSchema.id))
      .leftJoin(feedSchema, eq(collectionsToFeeds.feedId, feedSchema.id))
      .where(eq(collectionSchema.id, id))
      .execute();

    if (!result || result.length === 0) return Result.ok(false);

    const feeds = result.map((r) => (r.feeds ? [r.feeds] : []));

    return Result.ok({
      ...result[0].collections,
      feeds: feeds.flat()
    });
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding Collection by id:', error);
    return Result.ok(false);
  }
}

async function findBySlug(
  slug: string,
  userId: string
): Promise<Result<Collection | false, Error>> {
  try {
    const db = getClient();
    const result = await db.query.collectionSchema
      .findFirst({
        where: and(eq(collectionSchema.userId, userId), eq(collectionSchema.slug, slug))
      })
      .execute();

    if (!result) return Result.ok(false);

    return Result.ok(result);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding Collection by id:', error);
    return Result.err(error);
  }
}

async function findBySlugWithFeeds(
  slug: string,
  userId: string
): Promise<Result<CollectionWithFeeds | false, Error>> {
  try {
    const db = getClient();
    const result = await db
      .select()
      .from(collectionSchema)
      .leftJoin(collectionsToFeeds, eq(collectionsToFeeds.collectionId, collectionSchema.id))
      .leftJoin(feedSchema, eq(collectionsToFeeds.feedId, feedSchema.id))
      .where(and(eq(collectionSchema.userId, userId), eq(collectionSchema.slug, slug)))
      .execute();

    if (!result || result.length === 0) return Result.ok(false);

    const feeds = result.map((r) => (r.feeds ? [r.feeds] : []));

    return Result.ok({
      ...result[0].collections,
      feeds: feeds.flat()
    });
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding Collections by userId:', error);
    return Result.err(error);
  }
}

async function findByUserId(userId: string): Promise<Result<Collection[] | false, Error>> {
  try {
    const db = getClient();
    const result = await db.query.collectionSchema.findMany({
      where: eq(collectionSchema.userId, userId)
    });
    if (!result || result.length === 0) return Result.ok(false);

    return Result.ok(result);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding Collections by userId:', error);
    return Result.err(error);
  }
}

async function findByUserIdWithFeeds(
  userId: string
): Promise<Result<CollectionWithFeeds[] | false, Error>> {
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

  if (!result || result.length === 0) return Result.ok(false);

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

  return Result.ok(processedCollections);
}

async function findDefaultByUserId(userId: string): Promise<Result<Collection | false, Error>> {
  try {
    const db = getClient();
    const result = await db.query.collectionSchema
      .findFirst({
        where: and(eq(collectionSchema.userId, userId), like(collectionSchema.id, 'default-%'))
      })
      .execute();

    if (!result) return Result.ok(false);

    return Result.ok(result);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding Collection by user id:', error);
    return Result.err(error);
  }
}

async function findDefaultByUserIdWithFeeds(
  userId: string
): Promise<Result<CollectionWithFeeds | false, Error>> {
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

    if (!result) return Result.ok(false);

    const feeds = result.collectionsToFeeds?.map((b) => b.feed) || [];

    return Result.ok({
      id: result.id,
      slug: result.slug,
      name: result.name,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      userId: result.userId,
      feeds
    });
  } catch (error) {
    const e = normalizeError(error);
    console.error('Error occurred while finding default collection by user id:', e);
    return Result.err(e);
  }
}

async function removeFeedFromCollection(id: string, feedId: string): Promise<Result<true, Error>> {
  try {
    const result = (await feedRepository.findById(feedId)).unwrap();

    if (!result) {
      return Result.err(new Error('Feed not found'));
    }

    const db = getClient();

    await db
      .delete(collectionsToFeeds)
      .where(and(eq(collectionsToFeeds.collectionId, id), eq(collectionsToFeeds.feedId, feedId)))
      .execute();

    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while removing feed from collection:', error);
    return Result.err(error);
  }
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
