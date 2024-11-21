import boardRepository from '@/server/data/repositories/board.repository';
import { validateAuthSession } from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
  const authSession = await validateAuthSession(cookies);

  if (!authSession) {
    redirect(302, '/auth/login');
  }

  return {
    boards: await boardRepository.findBoardsByUserId(authSession.user.id, true)
  };
}) satisfies PageServerLoad;
