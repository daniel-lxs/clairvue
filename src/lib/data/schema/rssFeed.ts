import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import type { Article } from './article';

export const rssFeedSchema = sqliteTable('rssFeeds', {
	id: text('id').primaryKey().notNull(),
	name: text('name').notNull(),
	description: text('description').notNull().default('No description'),
	link: text('link').unique().notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export type rssFeed = {
	id: string;
	name: string;
	link: string;
	description?: string;
	articles?: Article[];
	createdAt: Date;
	updatedAt: Date;
};
