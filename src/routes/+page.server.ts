import { validateAuthSession } from '@/server/services/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const cookieHeader = cookies.get('auth_session');

  if (!cookieHeader) {
    return {
      session: null
    };
  }

  const authSession = await validateAuthSession(cookieHeader);

  if (!authSession) {
    return {
      session: null
    };
  }

  return {
    session: authSession
  };
};
