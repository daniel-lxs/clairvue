import { error, redirect } from '@sveltejs/kit';
import authService from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import articleService from '@/server/services/article.service';
import feedService from '@/server/services/feed.service';
import type { Feed } from '@clairvue/types';

export const load: PageServerLoad = async ({ params: { slug: feedId }, cookies }) => {
  const authSessionResult = await authService.validateAuthSession(cookies);

  return authSessionResult.match({
    ok: async (authSession) => {
      if (!authSession) {
        redirect(302, '/auth/login');
      }

      const feedResult = await feedService.findById(feedId);

      if (feedResult.isErr()) {
        return error(500, feedResult.unwrapErr().message);
      }

      if (feedResult.isOkAnd((feed) => !feed)) {
        return error(404, 'Feed not found');
      }

      const limitPerPage = 20;
      return {
        feed: feedResult.unwrap() as Feed,
        streamed: {
          articles: articleService.findByFeedId(feedId, undefined, limitPerPage)
        }
      };
    },
    err: () => {
      redirect(302, '/auth/login');
    }
  });
};
