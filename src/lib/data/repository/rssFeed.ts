import { rssFeedSchema, type rssFeed, rssFeedToBoard } from '../schema';
import feedRepository from './board';
import db from '../db';
import { eq } from 'drizzle-orm';
import ShortUniqueId from 'short-unique-id';

function create(
	newRssFeed: Pick<rssFeed, 'name' | 'description' | 'link'>,
	boardId: string
): rssFeed | undefined {
	const feed = feedRepository.findById(boardId, true);
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
		const existingRssFeed = findByLink(newRssFeed.link);
		if (existingRssFeed) {
			db.insert(rssFeedToBoard)
				.values({
					rssFeedId: existingRssFeed.id,
					boardId
				})
				.run();

			return existingRssFeed;
		}

		const { randomUUID } = new ShortUniqueId({ length: 8 });
		const id = randomUUID();
		const createdAt = new Date();
		const updatedAt = new Date();

		db.insert(rssFeedSchema)
			.values({
				id,
				name: newRssFeed.name,
				description: newRssFeed.description,
				link: newRssFeed.link,
				createdAt,
				updatedAt
			})
			.returning({
				id: rssFeedSchema.id
			})
			.get();

		db.insert(rssFeedToBoard)
			.values({
				rssFeedId: id,
				boardId
			})
			.run();

		return {
			id,
			name: newRssFeed.name,
			description: newRssFeed.description,
			link: newRssFeed.link,
			createdAt,
			updatedAt
		};
	} catch (error) {
		console.error('Error occurred while creating new RSS feed:', error);
		return undefined;
	}
}

function findById(id: string): rssFeed | undefined {
	try {
		const result = db.select().from(rssFeedSchema).where(eq(rssFeedSchema.id, id)).all();

		const rssFeed = result[0];
		if (!rssFeed) return undefined;

		return rssFeed;
	} catch (error) {
		console.error('Error occurred while finding RSS feed by link:', error);
		return undefined;
	}
}

function findByLink(link: string): rssFeed | undefined {
	try {
		const result = db.select().from(rssFeedSchema).where(eq(rssFeedSchema.link, link)).all();

		const rssFeed = result[0];
		if (!rssFeed) return undefined;

		return rssFeed;
	} catch (error) {
		console.error('Error occurred while finding RSS feed by link:', error);
		return undefined;
	}
}

function update(updatedRssFeed: Pick<rssFeed, 'id' | 'name' | 'description' | 'link'>) {
	try {
		const currentDate = new Date();
		db.update(rssFeedSchema)
			.set({
				...updatedRssFeed,
				updatedAt: currentDate
			})
			.where(eq(rssFeedSchema.id, updatedRssFeed.id))
			.run();
	} catch (error) {
		console.error('Error occurred while updating RSS feed:', error);
		throw error;
	}
}

//delete is a ts keyword
function remove(id: string) {
	try {
		db.delete(rssFeedSchema).where(eq(rssFeedSchema.id, id)).run();
		db.delete(rssFeedToBoard).where(eq(rssFeedToBoard.rssFeedId, id)).run();
	} catch (error) {
		console.error('Error occurred while deleting RSS feed:', error);
	}
}

export default {
	create,
	findById,
	findByLink,
	update,
	remove
};
