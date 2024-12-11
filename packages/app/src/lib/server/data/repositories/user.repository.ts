import { getClient } from '../db';
import { sessionSchema, userSchema } from '../schema/user.schema';
import { eq } from 'drizzle-orm';
import type { Session, User } from '../schema/user.schema';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { Result, type SessionValidationResult } from '@clairvue/types';
import { normalizeError } from '$lib/utils';
import { sha256 } from '@oslojs/crypto/sha2';

async function findByUsername(username: string): Promise<Result<User | false, Error>> {
  try {
    const db = getClient();
    const users = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.username, username))
      .execute();

    if (!users || users.length === 0) return Result.ok(false);

    return Result.ok(users[0]);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while finding user by username:', error);
    return Result.err(error);
  }
}

async function create(data: {
  id: string;
  username: string;
  hashedPassword: string;
}): Promise<Result<User, Error>> {
  try {
    const db = getClient();
    const [user] = await db.insert(userSchema).values(data).returning();
    return Result.ok(user);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while creating user:', error);
    return Result.err(error);
  }
}

async function createSession(session: Session): Promise<Result<Session, Error>> {
  try {
    const db = getClient();
    const savedSession = await db.insert(sessionSchema).values(session).returning();
    return Result.ok(savedSession[0]);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while creating session:', error);
    return Result.err(error);
  }
}

async function validateSession(
  token: string
): Promise<Result<SessionValidationResult | false, Error>> {
  try {
    const db = getClient();
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

    const result = await db
      .select({ user: userSchema, session: sessionSchema })
      .from(sessionSchema)
      .innerJoin(userSchema, eq(sessionSchema.userId, userSchema.id))
      .where(eq(sessionSchema.id, sessionId));

    if (!result || result.length < 1) {
      return Result.ok(false);
    }

    const { user, session } = result[0];

    if (!user || !session) {
      return Result.ok(false);
    }

    if (Date.now() >= session.expiresAt.getTime()) {
      await db.delete(sessionSchema).where(eq(sessionSchema.id, session.id));
      return Result.ok(false);
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

    return Result.ok({ session, user });
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while validating session:', error);
    return Result.err(error);
  }
}

async function deleteSession(sessionId: string): Promise<Result<true, Error>> {
  try {
    const db = getClient();
    await db.delete(sessionSchema).where(eq(sessionSchema.id, sessionId));
    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while deleting session:', error);
    return Result.err(error);
  }
}

export default {
  findByUsername,
  create,
  createSession,
  validateSession,
  deleteSession
};
