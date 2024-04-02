import { pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { boardsToFeeds } from './board';
import { articleSchema, type Article } from './article';
import { relations, type InferSelectModel } from 'drizzle-orm';

export const feedTypeEnum = pgEnum('type', ['rss', 'atom']);

export const feedSchema = pgTable('feeds', {
  id: varchar('id', { length: 8 }).primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  link: text('link').unique().notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  syncedAt: timestamp('syncedAt').notNull().defaultNow()
});

export const feedRelations = relations(feedSchema, ({ many }) => ({
  boardsToFeeds: many(boardsToFeeds),
  articles: many(articleSchema)
}));

export type Feed = InferSelectModel<typeof feedSchema> & {
  articles?: Article[];
  articleCount?: number;
};
