import ShortUniqueId from 'short-unique-id';
import db from '../db';
import { feedSchema, type Feed, rssFeedToFeed, rssFeedSchema } from '../schema';
import { eq } from 'drizzle-orm';

export function create(
	newFeed: Pick<Feed, 'name'>
): { slug: string; editCode: string } | undefined {
	try {
		const { randomUUID } = new ShortUniqueId({ length: 8 });

		const slug = randomUUID();
		const editCode = randomUUID();
		const currentDate = new Date();

		db.insert(feedSchema)
			.values({
				...newFeed,
				slug,
				editCode,
				createdAt: currentDate,
				updatedAt: currentDate
			})
			.run();
		return {
			slug,
			editCode
		};
	} catch (error) {
		console.error('Error occurred while creating new feed:', error);
		return undefined;
	}
}

export function findBySlug(slug: string): Feed | undefined {
	try {
		const result = db
			.select()
			.from(feedSchema)
			.where(eq(feedSchema.slug, slug))
			.leftJoin(rssFeedSchema, eq(rssFeedToFeed.rssFeedId, rssFeedSchema.id))
			.all();

		const feed = result[0];
		if (!feed) return undefined;
		const { rssFeeds, ...rest } = feed;
		return {
			...rest.feeds,
			RSSFeeds: rssFeeds ? [rssFeeds] : []
		};
	} catch (error) {
		console.error('Error occurred while finding feed by slug:', error);
		return undefined;
	}
}

export function update(updatedFeed: Pick<Feed, 'slug' | 'name'>) {
	try {
		const currentDate = new Date();
		db.update(feedSchema)
			.set({
				...updatedFeed,
				updatedAt: currentDate
			})
			.where(eq(feedSchema.slug, updatedFeed.slug))
			.run();
	} catch (error) {
		console.error('Error occurred while updating feed:', error);
	}
}
