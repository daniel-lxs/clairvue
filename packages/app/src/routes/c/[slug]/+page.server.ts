import { redirect, error } from '@sveltejs/kit';
import authService from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import collectionService from '@/server/services/collection.service';
import articleService from '@/server/services/article.service';
import { serializePromise } from '@/utils';
import type { Article, PaginatedList, Result } from '@clairvue/types';

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

      const articlesResult = await articleService.findByCollectionId(
        collection.id,
        undefined,
        limitPerPage
      );

      return articlesResult.match({
        err: (e) => {
          error(500, e.message);
        },
        ok: (articles) => {
          if (!articles) {
            error(404, 'Articles not found');
          }
          return {
            collection,
            articles
          };
        }
      });
    }
  });
};
