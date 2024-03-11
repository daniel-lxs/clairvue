import { and, eq } from 'drizzle-orm';
import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import { boardsToRssFeeds, rssFeedSchema, type RssFeed } from '../schema';
import feedRepository from './board';

async function create(
	newRssFeed: Pick<RssFeed, 'name' | 'description' | 'link'>,
	boardId: string
): Promise<RssFeed | undefined> {
	const db = getClient();

	const feed = await feedRepository.findById(boardId, true);
	if (!feed) {
		return undefined;
	}

	const isAlreadyRelated =
		feed.rssFeeds?.find((rssFeed) => rssFeed.link === newRssFeed.link) !== undefined;

	if (isAlreadyRelated) {
		throw new Error('RSS feed already exists in this board');
	}

	try {
		//check if rss feed already exists and if so relate it
		const existingRssFeed = await findByLink(newRssFeed.link);
		if (existingRssFeed) {
			await db
				.insert(boardsToRssFeeds)
				.values({
					rssFeedId: existingRssFeed.id,
					boardId
				})
				.execute();

			return existingRssFeed;
		}

		const { randomUUID } = new ShortUniqueId({ length: 8 });
		const id = randomUUID();

		const result = await db
			.insert(rssFeedSchema)
			.values({
				id,
				name: newRssFeed.name,
				description: newRssFeed.description,
				link: newRssFeed.link
			})
			.returning({
				id: rssFeedSchema.id,
				name: rssFeedSchema.name,
				description: rssFeedSchema.description,
				link: rssFeedSchema.link,
				createdAt: rssFeedSchema.createdAt,
				updatedAt: rssFeedSchema.updatedAt,
				syncedAt: rssFeedSchema.syncedAt
			})
			.execute();

		//insert relation
		await db
			.insert(boardsToRssFeeds)
			.values({
				rssFeedId: id,
				boardId
			})
			.execute();

		return result[0];
	} catch (error) {
		console.error('Error occurred while creating new RSS feed:', error);
		return undefined;
	}
}

async function findById(id: string): Promise<RssFeed | undefined> {
	try {
		const db = getClient();
		const result = await db.select().from(rssFeedSchema).where(eq(rssFeedSchema.id, id)).execute();

		const rssFeed = result[0];
		if (!rssFeed) return undefined;

		return rssFeed;
	} catch (error) {
		console.error('Error occurred while finding RSS feed by link:', error);
		return undefined;
	}
}

async function findByLink(link: string): Promise<RssFeed | undefined> {
	try {
		const db = getClient();
		const result = await db
			.select()
			.from(rssFeedSchema)
			.where(eq(rssFeedSchema.link, link))
			.execute();

		const rssFeed = result[0];
		if (!rssFeed) return undefined;

		return rssFeed;
	} catch (error) {
		console.error('Error occurred while finding RSS feed by link:', error);
		return undefined;
	}
}

async function findAll(take = 20, skip = 0): Promise<RssFeed[]> {
	try {
		const db = getClient();

		take = take > 100 ? 100 : take;

		const result = await db.select().from(rssFeedSchema).limit(take).offset(skip).execute();
		return result;
	} catch (error) {
		console.error('Error occurred while finding all RSS feeds:', error);
		return [];
	}
}

async function update(updatedRssFeed: Pick<RssFeed, 'id' | 'name' | 'description' | 'link'>) {
	try {
		const db = getClient();
		const currentDate = new Date();
		await db
			.update(rssFeedSchema)
			.set({
				...updatedRssFeed,
				updatedAt: currentDate
			})
			.where(eq(rssFeedSchema.id, updatedRssFeed.id)).execute;
	} catch (error) {
		console.error('Error occurred while updating RSS feed:', error);
		throw error;
	}
}

async function updateLastSync(id: string, lastSync: Date) {
	try {
		const db = getClient();
		await db
			.update(rssFeedSchema)
			.set({
				syncedAt: lastSync
			})
			.where(eq(rssFeedSchema.id, id)).execute;
	} catch (error) {
		console.error('Error occurred while updating RSS feed:', error);
		throw error;
	}
}

//delete is a ts keyword
async function remove(id: string, boardId: string) {
	try {
		const db = getClient();

		await db
			.delete(boardsToRssFeeds)
			.where(and(eq(boardsToRssFeeds.boardId, boardId), eq(boardsToRssFeeds.rssFeedId, id)))
			.execute();
	} catch (error) {
		console.error('Error occurred while deleting RSS feed:', error);
	}
}

export default {
	create,
	findById,
	findByLink,
	findAll,
	update,
	updateLastSync,
	remove
};
