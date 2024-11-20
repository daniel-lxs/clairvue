import articlesRepository from '@/server/data/repositories/article.repository';
import { redirect } from '@sveltejs/kit';
import { validateAuthSession } from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import feedRepository from '@/server/data/repositories/feed.repository';

export const load: PageServerLoad = async ({ params: { slug: feedId }, cookies }) => {
  const cookieHeader = cookies.get('auth_session');

  if (!cookieHeader) {
    redirect(302, '/auth/login');
  }

  const authSession = await validateAuthSession(cookieHeader);

  if (!authSession) {
    redirect(302, '/auth/login');
  }

  const feed = await feedRepository.findById(feedId);

  if (!feed) {
    throw new Error('Feed not found');
  }

  const limitPerPage = 20;
  return {
    feed,
    streamed: {
      articles: articlesRepository.findByFeedId(feedId, undefined, limitPerPage)
    }
  };
};
