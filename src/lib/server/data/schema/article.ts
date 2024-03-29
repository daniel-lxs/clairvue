import { boolean, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { rssFeedSchema, type RssFeed } from './rssFeed';
import { relations, type InferSelectModel } from 'drizzle-orm';

export const articleSchema = pgTable('articles', {
	id: serial('id').primaryKey(),
	slug: varchar('slug', { length: 8 }).notNull(),
	title: text('title').notNull(),
	link: text('link').unique().notNull(),
	rssFeedId: text('rssFeedId').notNull(),
	description: text('description'),
	siteName: text('siteName'),
	image: text('image'),
	author: text('author'),
	readable: boolean('readable').notNull().default(false),
	publishedAt: timestamp('publishedAt').notNull().defaultNow(),
	createdAt: timestamp('createdAt').defaultNow(),
	updatedAt: timestamp('updatedAt').defaultNow()
});

export const articleRelations = relations(articleSchema, ({ one }) => ({
	rssFeed: one(rssFeedSchema, { fields: [articleSchema.rssFeedId], references: [rssFeedSchema.id] })
}));

export type Article = InferSelectModel<typeof articleSchema> & {
	rssFeed?: RssFeed | null;
};
