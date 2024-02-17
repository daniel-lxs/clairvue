import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { rssFeedSchema, type rssFeed } from './rssFeed';

export const boardSchema = sqliteTable('boards', {
	id: text('id').primaryKey().notNull(),
	slug: text('slug').notNull(),
	name: text('name').notNull(),
	editCode: text('editCode').notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export const rssFeedToBoard = sqliteTable('rssFeedToFeed', {
	rssFeedId: text('rssFeedId')
		.notNull()
		.references(() => rssFeedSchema.id),
	boardId: text('boardId')
		.notNull()
		.references(() => boardSchema.id)
});

export type Board = {
	id: string;
	slug: string;
	name: string;
	rssFeeds?: rssFeed[];
	editCode: string;
	createdAt: Date;
	updatedAt: Date;
};
