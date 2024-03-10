import { pgTable, primaryKey, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { rssFeedSchema, type RssFeed } from './rssFeed';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { userSchema } from '.';

export const boardSchema = pgTable('boards', {
	id: varchar('id', { length: 8 }).primaryKey().notNull(),
	slug: text('slug').notNull(),
	name: text('name').notNull(),
	userId: text('userId')
		.notNull()
		.references(() => userSchema.id),
	createdAt: timestamp('createdAt').notNull().defaultNow(),
	updatedAt: timestamp('updatedAt').notNull().defaultNow()
});

export const boardRelations = relations(boardSchema, ({ one, many }) => ({
	boardsToRssfeeds: many(boardsToRssFeeds),
	user: one(userSchema, { fields: [boardSchema.userId], references: [userSchema.id] })
}));

//TODO: Check if there's a better way to do this
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
