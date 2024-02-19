import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { boardsToRssFeeds } from './board';
import { articleSchema, type Article } from './article';
import { relations, type InferSelectModel } from 'drizzle-orm';

export const rssFeedSchema = pgTable('rssFeeds', {
	id: varchar('id', { length: 8 }).primaryKey().notNull(),
	name: text('name').notNull(),
	description: text('description').notNull().default('No description'),
	link: text('link').unique().notNull(),
	createdAt: timestamp('createdAt').notNull().defaultNow(),
	updatedAt: timestamp('updatedAt').notNull().defaultNow()
});

export const rssFeedRelations = relations(rssFeedSchema, ({ many }) => ({
	boardsToRssFeeds: many(boardsToRssFeeds),
	articles: many(articleSchema)
}));

export type RssFeed = InferSelectModel<typeof rssFeedSchema> & {
	articles?: Article[];
};
