import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { rssFeedSchema } from './rssFeed';
import { relations, type InferSelectModel } from 'drizzle-orm';

export const articleSchema = pgTable('articles', {
	id: varchar('id', { length: 8 }).primaryKey().notNull(),
	title: text('title').notNull(),
	link: text('link').unique().notNull(),
	rssFeedId: text('rssFeedId').notNull(),
	description: text('description'),
	siteName: text('siteName'),
	image: text('image'),
	publishedAt: timestamp('publishedAt').notNull().defaultNow(),
	createdAt: timestamp('createdAt').defaultNow(),
	updatedAt: timestamp('updatedAt').defaultNow()
});

export const articleRelations = relations(articleSchema, ({ one }) => ({
	rssFeed: one(rssFeedSchema, { fields: [articleSchema.rssFeedId], references: [rssFeedSchema.id] })
}));

export type Article = InferSelectModel<typeof articleSchema>;
