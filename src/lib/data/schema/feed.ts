import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { rssFeedSchema, type RSSFeed } from './rssFeed';

export const feedSchema = sqliteTable('feeds', {
	id: text('id').primaryKey().notNull(),
	slug: text('slug').notNull(),
	name: text('name').notNull(),
	editCode: text('editCode').notNull(),
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

export type NewFeed = Pick<Feed, 'slug' | 'name' | 'editCode'>;

export type Feed = {
	id: string;
	slug: string;
	name: string;
	RSSFeeds: RSSFeed[];
	editCode: string;
	createdAt: Date;
	updatedAt: Date;
};
