import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import type { Cookies } from '@sveltejs/kit';
import type { Session } from '../data/schema';
import { sha256 } from '@oslojs/crypto/sha2';
import userRepository from '../data/repositories/user.repository';
import type { SessionValidationResult } from '@clairvue/types';
import { Result } from '@clairvue/types';

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

async function createSession(token: string, userId: string): Promise<Result<Session, Error>> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
  };
  return await userRepository.createSession(session);
}

async function validateSessionToken(
  token: string
): Promise<Result<SessionValidationResult | false, Error>> {
  return await userRepository.validateSession(token);
}

async function invalidateSession(sessionId: string): Promise<Result<true, Error>> {
  return await userRepository.deleteSession(sessionId);
}

function generateSessionCookie(sessionId: string) {
  return {
    name: 'auth_session',
    value: sessionId,
    attributes: {
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      httpOnly: true,
      sameSite: 'lax' as const
    }
  };
}

async function validateAuthSession(
  cookies: Cookies
): Promise<Result<SessionValidationResult | false, Error>> {
  const sessionId = cookies.get('auth_session');

  if (!sessionId) {
    return Result.err(new Error('No session found'));
  }

  return (await userRepository.validateSession(sessionId)).match({
    ok: (authSession) => {
      if (authSession) {
        if (authSession.session.expiresAt < new Date()) {
          return Result.ok(false);
        }
        return Result.ok({ session: authSession.session, user: authSession.user });
      }
      return Result.ok(false);
    },
    err: (error) => {
      return Result.err(error);
    }
  });
}

export default {
  generateSessionToken,
  createSession,
  validateSessionToken,
  invalidateSession,
  generateSessionCookie,
  validateAuthSession
};
