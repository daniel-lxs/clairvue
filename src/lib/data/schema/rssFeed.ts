import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import type { Article } from './article';

export const rssFeedSchema = sqliteTable('rssFeeds', {
	id: text('id').primaryKey().notNull(),
	name: text('name').notNull(),
	description: text('description'),
	link: text('link').notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export type RSSFeed = {
	id: string;
	name: string;
	description?: string;
	link: string;
	articles: Article[];
	createdAt: Date;
	updatedAt: Date;
};
