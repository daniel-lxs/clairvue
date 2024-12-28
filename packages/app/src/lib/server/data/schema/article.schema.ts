import { boolean, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { feedSchema } from './feed.schema';
import { relations } from 'drizzle-orm';

export const articleSchema = pgTable('articles', {
  id: varchar('id').primaryKey(),
  slug: varchar('slug').notNull(),
  title: text('title').notNull(),
  link: text('link').unique().notNull(),
  description: text('description'),
  siteName: text('siteName').notNull(),
  image: text('image'),
  author: text('author'),
  readable: boolean('readable').notNull().default(false),
  publishedAt: timestamp('publishedAt').notNull().defaultNow(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  feedId: varchar('feedId')
    .notNull()
    .references(() => feedSchema.id)
});

export const articleRelations = relations(articleSchema, ({ one }) => ({
  feed: one(feedSchema, {
    fields: [articleSchema.feedId],
    references: [feedSchema.id]
  })
}));
