import ShortUniqueId from 'short-unique-id';
import { getClient } from '../db';
import { articleSchema, type Article } from '../schema';
import { eq } from 'drizzle-orm';

export async function create(newArticle: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) {
	const db = getClient();

	const { randomUUID } = new ShortUniqueId({ length: 8 });

	const id = randomUUID();

	try {
		await db
			.insert(articleSchema)
			.values({
				id,
				...newArticle
			})
			.execute();
		return id;
	} catch (error) {
		console.error('Error occurred while creating new Article:', error);
		return undefined;
	}
}

export async function findById(id: string) {
	try {
		const db = getClient();
		const result = await db.select().from(articleSchema).where(eq(articleSchema.id, id)).execute();
		return result[0];
	} catch (error) {
		console.error('Error occurred while finding Article by id:', error);
		return undefined;
	}
}

export async function findByLink(link: string) {
	try {
		const db = getClient();
		const result = await db
			.select()
			.from(articleSchema)
			.where(eq(articleSchema.link, link))
			.execute();
		return result[0];
	} catch (error) {
		console.error('Error occurred while finding Article by link:', error);
		return undefined;
	}
}

async function findByRssFeedId(rssFeedId: string) {
	try {
		const db = getClient();
		const result = await db
			.select()
			.from(articleSchema)
			.where(eq(articleSchema.rssFeedId, rssFeedId))
			.execute();
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
