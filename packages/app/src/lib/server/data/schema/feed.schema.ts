import { pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { collectionsToFeeds } from './collection.schema';
import { articleSchema } from './article.schema';
import { relations } from 'drizzle-orm';

export const feedTypeEnum = pgEnum('type', ['rss', 'atom']);

export const feedSchema = pgTable('feeds', {
  id: varchar('id').primaryKey().notNull(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  link: text('link').unique().notNull(),
  type: feedTypeEnum('type').notNull().default('rss'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  syncedAt: timestamp('syncedAt').notNull().defaultNow()
});

export const feedRelations = relations(feedSchema, ({ many }) => ({
  collectionsToFeeds: many(collectionsToFeeds),
  articles: many(articleSchema)
}));
