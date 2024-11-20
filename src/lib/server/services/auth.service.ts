import { Lucia, type Session, type User } from 'lucia';
import { dev } from '$app/environment';
import { adapter } from '@/server/data/db';

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev
    }
  },
  getUserAttributes: (attributes) => {
    return {
      // attributes has the type of DatabaseUserAttributes
      username: attributes.username
    };
  }
});

export async function validateAuthSession(
  authSession: string
): Promise<{ session: Session; user: User } | undefined> {
  const sessionId = lucia.readSessionCookie(`auth_session=${authSession}`);
  if (!sessionId) {
    return undefined;
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (!session || !user || session.expiresAt < new Date()) {
    return undefined;
  }

  return {
    session,
    user
  };
}

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  username: string;
}
