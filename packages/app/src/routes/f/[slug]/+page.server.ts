import { error, redirect } from '@sveltejs/kit';
import authService from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import articleService from '@/server/services/article.service';
import feedService from '@/server/services/feed.service';
import type { ArticleWithInteraction, Feed, PaginatedList, Result } from '@clairvue/types';

export const load: PageServerLoad = async ({ params: { slug: feedId }, cookies }) => {
  const authSessionResult = await authService.validateAuthSession(cookies);

  return authSessionResult.match({
    err: () => {
      redirect(302, '/auth/login');
    },
    ok: async (authSession) => {
      if (!authSession) {
        redirect(302, '/auth/login');
      }

      const feedResult = await feedService.findById(feedId);

      if (feedResult.isErr()) {
        return error(500, feedResult.unwrapErr().message);
      }

      if (feedResult.isOkAnd((feed) => feed === false)) {
        return error(404, 'Feed not found');
      }
      const limitPerPage = 20;
      const articleResult = articleService.findByFeedIdWithInteractions(
        feedId,
        authSession.user.id,
        undefined,
        limitPerPage
      );

      const unwrapPromise = async (
        resultPromise: Promise<Result<false | PaginatedList<ArticleWithInteraction>, Error>>
      ) => {
        const result = await resultPromise;

        if (result.isErr()) {
          return {
            items: [],
            totalCount: 0
          };
        }

        if (result.isOkAnd((value) => value === false)) {
          return {
            items: [],
            totalCount: 0
          };
        }

        return result.unwrap() as PaginatedList<ArticleWithInteraction>;
      };

      return {
        feed: feedResult.unwrap() as Feed,
        streamed: {
          articles: unwrapPromise(articleResult)
        }
      };
    }
  });
};
