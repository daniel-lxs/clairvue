import boardRepository from '@/server/data/repositories/board.repository';
import { validateAuthSession } from '@/server/services/auth.service';
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
    boards: await boardRepository.findBoardsByUserId(authSession.user.id, true)
  };
}) satisfies PageServerLoad;
