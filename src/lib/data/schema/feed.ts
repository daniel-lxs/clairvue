import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type { RSSFeed } from './rssFeed';

export const feedSchema = sqliteTable('feeds', {
	id: text('id').primaryKey().notNull(),
	slug: text('slug').notNull(),
	name: text('name').notNull(),
	editCode: text('editCode').notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export type Feed = {
	id: string;
	slug: string;
	name: string;
	RSSFeed: RSSFeed;
	editCode: string;
	createdAt: Date;
	updatedAt: Date;
};
