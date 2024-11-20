import boardRepository from '@/server/data/repositories/board.repository';
import articlesRepository from '@/server/data/repositories/article.repository';
import { redirect } from '@sveltejs/kit';
import { validateAuthSession } from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params: { slug }, cookies }) => {
  const cookieHeader = cookies.get('auth_session');

  if (!cookieHeader) {
    redirect(302, '/auth/login');
  }

  const authSession = await validateAuthSession(cookieHeader);

  if (!authSession) {
    redirect(302, '/auth/login');
  }

  const board = await boardRepository.findBySlug(authSession.user.id, slug, true);

  if (!board) {
    throw new Error('Board not found');
  }

  const limitPerPage = 20;
  return {
    board,
    streamed: {
      articles: articlesRepository.findByBoardId(board.id, undefined, limitPerPage)
    }
  };
};
