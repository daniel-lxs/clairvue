import { boolean, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { feedSchema, type Feed } from './feed.schema';
import { relations, type InferSelectModel } from 'drizzle-orm';

export const articleSchema = pgTable('articles', {
  id: varchar('id').primaryKey(),
  slug: varchar('slug').notNull(),
  title: text('title').notNull(),
  link: text('link').unique().notNull(),
  feedId: text('feedId')
    .notNull()
    .references(() => feedSchema.id, { onDelete: 'cascade' }),
  description: text('description'),
  siteName: text('siteName').notNull(),
  image: text('image'),
  author: text('author'),
  readable: boolean('readable').notNull().default(false),
  publishedAt: timestamp('publishedAt').notNull().defaultNow(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
});

export const articleRelations = relations(articleSchema, ({ one }) => ({
  feed: one(feedSchema, { fields: [articleSchema.feedId], references: [feedSchema.id] })
}));

export type Article = InferSelectModel<typeof articleSchema> & {
  feed?: Feed | null;
};
