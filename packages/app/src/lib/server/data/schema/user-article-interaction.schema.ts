import { boolean, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core';
import { articleSchema } from './article.schema';
import { userSchema } from '.';
import { relations } from 'drizzle-orm';

export const userArticleInteractions = pgTable(
  'userArticleInteractions',
  {
    userId: varchar('userId')
      .notNull()
      .references(() => userSchema.id),
    articleId: varchar('articleId')
      .notNull()
      .references(() => articleSchema.id),
    read: boolean('read').notNull().default(false),
    saved: boolean('saved').notNull().default(false),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.articleId] })
  })
);

export const userArticleInteractionsRelations = relations(userArticleInteractions, ({ one }) => ({
  user: one(userSchema, {
    fields: [userArticleInteractions.userId],
    references: [userSchema.id]
  }),
  article: one(articleSchema, {
    fields: [userArticleInteractions.articleId],
    references: [articleSchema.id]
  })
}));
