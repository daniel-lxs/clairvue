import { boolean, pgTable, primaryKey, text, timestamp, varchar } from 'drizzle-orm/pg-core';
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
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
});

export const articleRelations = relations(articleSchema, ({ many }) => ({
  articlesToFeeds: many(articlesToFeeds)
}));

export const articlesToFeeds = pgTable(
  'articlesToFeeds',
  {
    articleId: varchar('articleId')
      .notNull()
      .references(() => articleSchema.id),
    feedId: varchar('feedId')
      .notNull()
      .references(() => feedSchema.id)
  },
  (t) => ({
    pk: primaryKey({ columns: [t.articleId, t.feedId] })
  })
);

export const articlesToFeedsRelations = relations(articlesToFeeds, ({ one }) => ({
  article: one(articleSchema, {
    fields: [articlesToFeeds.articleId],
    references: [articleSchema.id]
  }),
  feed: one(feedSchema, {
    fields: [articlesToFeeds.feedId],
    references: [feedSchema.id]
  })
}));
