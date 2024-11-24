import { pgTable, primaryKey, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { feedSchema, type Feed } from './feed.schema';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { userSchema } from '.';

export const collectionSchema = pgTable('collections', {
  id: varchar('id').primaryKey().notNull(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => userSchema.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
});

export const collectionRelations = relations(collectionSchema, ({ one, many }) => ({
  collectionsToFeeds: many(collectionsToFeeds),
  user: one(userSchema, { fields: [collectionSchema.userId], references: [userSchema.id] })
}));

//TODO: Check if there's a better way to do this
export const collectionsToFeeds = pgTable(
  'collectionsToFeeds',
  {
    collectionId: varchar('collectionId').notNull(),
    feedId: varchar('feedId').notNull()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.collectionId, t.feedId] })
  })
);

export const collectionsToFeedsRelations = relations(collectionsToFeeds, ({ one }) => ({
  collection: one(collectionSchema, {
    fields: [collectionsToFeeds.collectionId],
    references: [collectionSchema.id]
  }),
  feed: one(feedSchema, {
    fields: [collectionsToFeeds.feedId],
    references: [feedSchema.id]
  })
}));

export type Collection = InferSelectModel<typeof collectionSchema>;
export type CollectionWithFeeds = InferSelectModel<typeof collectionSchema> & {
  feeds: Feed[];
};
