import { findBoardsByUserId } from '@/server/services/board.service';
import { validateAuthSession } from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
  const authSession = await validateAuthSession(cookies);
  if (!authSession) {
    redirect(302, '/auth/login');
  }

  const boards = await findBoardsByUserId(authSession.user.id, true);
  const defaultBoard = boards?.find(board => board.id.startsWith('default-'));
  const otherBoards = boards?.filter(board => !board.id.startsWith('default-'));

  return {
    boards: otherBoards || [],
    defaultBoard,
    userId: authSession.user.id
  };
}) satisfies PageServerLoad;
