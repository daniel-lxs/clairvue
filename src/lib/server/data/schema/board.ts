import { pgTable, primaryKey, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { rssFeedSchema, type RssFeed } from './rssFeed';
import { relations, type InferSelectModel } from 'drizzle-orm';

export const boardSchema = pgTable('boards', {
	id: varchar('id', { length: 8 }).primaryKey().notNull(),
	slug: text('slug').notNull(),
	name: text('name').notNull(),
	editCode: text('editCode').notNull(),
	createdAt: timestamp('createdAt').notNull().defaultNow(),
	updatedAt: timestamp('updatedAt').notNull().defaultNow()
});

export const boardRelations = relations(boardSchema, ({ many }) => ({
	boardsToRssfeeds: many(boardsToRssFeeds)
}));

export const boardsToRssFeeds = pgTable(
	'boardsToRssFeeds',
	{
		boardId: varchar('boardId', { length: 8 }).notNull(),
		rssFeedId: varchar('rssFeedId', { length: 8 }).notNull()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.boardId, t.rssFeedId] })
	})
);

export const boardsToRssFeedsRelations = relations(boardsToRssFeeds, ({ one }) => ({
	board: one(boardSchema, { fields: [boardsToRssFeeds.boardId], references: [boardSchema.id] }),
	rssFeed: one(rssFeedSchema, {
		fields: [boardsToRssFeeds.rssFeedId],
		references: [rssFeedSchema.id]
	})
}));

export type Board = InferSelectModel<typeof boardSchema> & {
	rssFeeds: RssFeed[];
};
