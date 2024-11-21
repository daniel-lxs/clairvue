import type { InferSelectModel } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const userSchema = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  hashedPassword: text('hashedPassword').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow()
});

export const sessionSchema = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => userSchema.id),
	expiresAt: timestamp("expiresAt", {
		withTimezone: true,
		mode: "date"
	}).notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow()
});

export type User = InferSelectModel<typeof userSchema>;
export type Session = InferSelectModel<typeof sessionSchema>;