import { pgTable, primaryKey, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { feedSchema, type Feed } from './feed.schema';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { userSchema } from '.';

export const boardSchema = pgTable('boards', {
  id: varchar('id').primaryKey().notNull(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => userSchema.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
});

export const boardRelations = relations(boardSchema, ({ one, many }) => ({
  boardsToFeeds: many(boardsToFeeds),
  user: one(userSchema, { fields: [boardSchema.userId], references: [userSchema.id] })
}));

//TODO: Check if there's a better way to do this
export const boardsToFeeds = pgTable(
  'boardsToFeeds',
  {
    boardId: varchar('boardId').notNull(),
    feedId: varchar('feedId').notNull()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.boardId, t.feedId] })
  })
);

export const boardsToFeedsRelations = relations(boardsToFeeds, ({ one }) => ({
  board: one(boardSchema, { fields: [boardsToFeeds.boardId], references: [boardSchema.id] }),
  feed: one(feedSchema, {
    fields: [boardsToFeeds.feedId],
    references: [feedSchema.id]
  })
}));

export type Board = InferSelectModel<typeof boardSchema> & {
  feeds?: Feed[];
};
