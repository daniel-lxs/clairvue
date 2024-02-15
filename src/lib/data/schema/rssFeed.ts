import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { feedSchema, type Feed } from './feed';
import type { Article } from './article';

export const rssFeedSchema = sqliteTable('rssFeeds', {
	id: text('id').primaryKey().notNull(),
	name: text('name').notNull(),
	description: text('description'),
	link: text('link').notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export const rssFeedToFeed = sqliteTable('rssFeedToFeed', {
	rssFeedId: text('rssFeedId')
		.notNull()
		.references(() => rssFeedSchema.id),
	feedId: text('feedId')
		.notNull()
		.references(() => feedSchema.id)
});

export type RSSFeed = {
	id: string;
	name: string;
	description?: string;
	link: string;
	feeds: Feed[];
	articles: Article[];
	createdAt: number;
	updatedAt: number;
};
