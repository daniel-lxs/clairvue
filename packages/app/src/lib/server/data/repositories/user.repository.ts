import { getClient } from '../db';
import { sessionSchema, userSchema } from '../schema/user.schema';
import { eq } from 'drizzle-orm';
import type { Session, User } from '../schema/user.schema';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';

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

export async function createSession(session: Session) {
  const db = getClient();
  await db.insert(sessionSchema).values(session).returning();
}

export async function validateSession(
  token: string
): Promise<{ session: Session | null; user: User | null }> {
  const db = getClient();
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  const result = await db
    .select({ user: userSchema, session: sessionSchema })
    .from(sessionSchema)
    .innerJoin(userSchema, eq(sessionSchema.userId, userSchema.id))
    .where(eq(sessionSchema.id, sessionId));

  if (result.length < 1) {
    return { session: null, user: null };
  }

  const { user, session } = result[0];

  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessionSchema).where(eq(sessionSchema.id, session.id));
    return { session: null, user: null };
  }

  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db
      .update(sessionSchema)
      .set({
        expiresAt: newExpiresAt
      })
      .where(eq(sessionSchema.id, session.id));
    session.expiresAt = newExpiresAt;
  }

  return { session, user };
}

export async function deleteSession(sessionId: string) {
  const db = getClient();
  await db.delete(sessionSchema).where(eq(sessionSchema.id, sessionId));
}
