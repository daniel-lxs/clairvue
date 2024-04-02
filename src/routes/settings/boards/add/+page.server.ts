import { validateAuthSession } from '@/server/services/auth';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
  const cookieHeader = cookies.get('auth_session');

  if (!cookieHeader) {
    redirect(302, '/auth/login');
  }

  const authSession = await validateAuthSession(cookieHeader);

  if (!authSession) {
    redirect(302, '/auth/login');
  }

  return {
    userId: authSession.user.id
  };
}) satisfies PageServerLoad;
