import { getClient } from '../db';
import { userSchema } from '../schema/user';
import { eq } from 'drizzle-orm';
import type { User } from '../schema/user';

export async function findByUsername(username: string): Promise<User | undefined> {
  const db = getClient();
  const users = await db
    .select()
    .from(userSchema)
    .where(eq(userSchema.username, username))
    .execute();
  return users[0];
}

export async function create(data: {
  id: string;
  username: string;
  hashedPassword: string;
}): Promise<User> {
  const db = getClient();
  const [user] = await db.insert(userSchema).values(data).returning();
  return user;
}
