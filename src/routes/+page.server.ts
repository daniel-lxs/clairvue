import { validateAuthSession } from '@/server/services/auth';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

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

  redirect(302, '/boards');
};
