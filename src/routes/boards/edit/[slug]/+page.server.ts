import boardRepository from '@/server/data/repositories/board.repository';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { validateAuthSession } from '@/server/services/auth.service';
import feedRepository from '@/server/data/repositories/feed.repository';

export const load = (async ({ params: { slug }, cookies }) => {
  const authSession = await validateAuthSession(cookies);

  if (!authSession) {
    redirect(302, '/auth/login');
  }

  const getBoard = async () => {
    const board = await boardRepository.findBySlug(authSession.user.id, slug, true);

    if (!board) {
      redirect(302, '/board/new');
    }

    if (board.feeds && board.feeds.length > 0) {
      board.feeds = await Promise.all(
        board?.feeds.map(async (feed) => {
          const articleCount = await feedRepository.countArticles(feed.id);
          return {
            ...feed,
            articleCount
          };
        })
      );
    }

    return board;
  };

  return {
    streamed: {
      board: getBoard()
    }
  };
}) satisfies PageServerLoad;
