import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { rssFeedSchema } from './rssFeed';
import { relations, type InferSelectModel } from 'drizzle-orm';

export const articleSchema = pgTable('articles', {
	id: varchar('id', { length: 8 }).primaryKey().notNull(),
	title: text('title').notNull(),
	link: text('link').notNull(),
	excerpt: text('excerpt').notNull(),
	rssFeedId: text('rssFeedId').notNull(),
	publishedAt: timestamp('publishedAt').defaultNow(),
	createdAt: timestamp('createdAt').defaultNow(),
	updatedAt: timestamp('updatedAt').defaultNow()
});

export const articleRelations = relations(articleSchema, ({ one }) => ({
	rssFeed: one(rssFeedSchema, { fields: [articleSchema.rssFeedId], references: [rssFeedSchema.id] })
}));

export type Article = InferSelectModel<typeof articleSchema>;
