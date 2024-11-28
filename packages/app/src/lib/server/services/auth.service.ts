import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import type { Cookies } from '@sveltejs/kit';
import type { Session, User } from '../data/schema';
import { sha256 } from "@oslojs/crypto/sha2";
import { createSession as insertSession, validateSession, deleteSession } from "../data/repositories/user.repository";
import type { SessionValidationResult } from '@clairvue/types'

export function generateSessionToken(): string {
	const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

export async function createSession(token: string, userId: string): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
    createdAt: new Date(),
    updatedAt: new Date(),
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	await insertSession(session);
	return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const { session, user } = await validateSession(token);
  return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await deleteSession(sessionId);
}

export function generateSessionCookie(sessionId: string) {
  return {
    name: 'auth_session',
    value: sessionId,
    attributes: {
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      httpOnly: true,
      sameSite: 'lax' as const
    }
  }
}
  


export async function validateAuthSession(
  cookies: Cookies
): Promise<{ session: Session; user: User } | undefined> {
  const sessionId = cookies.get('auth_session');


  if (!sessionId) {
    return undefined;
  }


  const { session, user } = await validateSession(sessionId);
  if (!session || !user || session.expiresAt < new Date()) {
    return undefined;
  }

  return {
    session,
    user
  };
}