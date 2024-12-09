import { redirect, error } from '@sveltejs/kit';
import authService from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import collectionService from '@/server/services/collection.service';
import articleService from '@/server/services/article.service';
import type { ArticleWithFeed, PaginatedList, Result } from '@clairvue/types';

export const load: PageServerLoad = async ({ params: { slug }, cookies }) => {
  const authSessionResult = await authService.validateAuthSession(cookies);

  return authSessionResult.match({
    err: (e) => {
      error(500, e.message);
    },
    ok: async (authSession) => {
      if (!authSession) {
        redirect(302, '/auth/login');
      }

      const collectionResult = await collectionService.findBySlugWithFeeds(
        slug,
        authSession.user.id
      );

      if (collectionResult.isErr()) {
        error(500, collectionResult.unwrapErr().message);
      }

      const collection = collectionResult.unwrap();

      if (!collection) {
        error(404, 'Collection not found');
      }

      const limitPerPage = 20;

      const articlesResult = articleService.findByCollectionId(
        collection.id,
        undefined,
        limitPerPage
      );

      const unwrapPromise = async (
        resultPromise: Promise<Result<false | PaginatedList<ArticleWithFeed>, Error>>
      ) => {
        const result = await resultPromise;

        if (result.isErr()) {
          error(500, result.unwrapErr().message);
        }

        if (result.isOkAnd((value) => value === false)) {
          error(404, 'Articles not found');
        }

        return result.unwrap() as PaginatedList<ArticleWithFeed>;
      };

      return {
        collection,
        streamed: {
          articles: unwrapPromise(articlesResult)
        }
      };
    }
  });
};
