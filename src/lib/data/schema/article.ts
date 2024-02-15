import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { rssFeedSchema } from './rssFeed';

export const articleSchema = sqliteTable('articles', {
	id: text('id').primaryKey().notNull(),
	title: text('title').notNull(),
	link: text('link').notNull(),
	pubDate: integer('pubDate', { mode: 'timestamp' }),
	RSSFeedId: text('rssFeedId').references(() => rssFeedSchema.id),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull()
});

export type Article = {
	id: string;
	title: string;
	RSSFeedId: string;
	link: string;
	pubDate: number;
};
