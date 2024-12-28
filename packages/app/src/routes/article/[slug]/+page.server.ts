import { redirect } from '@sveltejs/kit';
import articleService from '@/server/services/article.service';
import cacheService from '@/server/services/cache.service';
import type { PageServerLoad } from './$types';
import { error } from 'console';
import type { ReadableArticle, Result } from '@clairvue/types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    redirect(302, '/auth/login');
  }

  const user = authSession.user;

  const slug = params.slug;

  const article = await articleService.findBySlug(slug);

  return article.match({
    ok: async (article) => {
      if (!article) {
        return {
          status: 404,
          error: 'Article not found',
          streamed: undefined,
          readableArticle: undefined,
          articleMetadata: undefined
        };
      }
      if (!article.readable) {
        throw redirect(302, article.link);
      }
      const cachedReadableArticleResult = await cacheService.getCachedReadableArticle(article.link);

      if (cachedReadableArticleResult.isErr()) {
        error(500, cachedReadableArticleResult.unwrapErr().message);
      }

      if (cachedReadableArticleResult.isOkAnd((value) => value === false)) {
        throw redirect(302, article.link);
      }

      const cachedReadableArticle = cachedReadableArticleResult.unwrap() as ReadableArticle;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const shouldRefresh = new Date(cachedReadableArticle.createdAt) < oneHourAgo;

      const unwrapPromise = async (
        resultPromise: Promise<Result<ReadableArticle | false, Error>>
      ) => {
        return (await resultPromise).match({
          ok: (value) => value,
          err: (error) => error
        });
      };

      const updateInteractionsResult = await articleService.updateInteractions(
        user.id,
        article.id,
        true,
        undefined
      );

      if (updateInteractionsResult.isErr()) {
        error(500, updateInteractionsResult.unwrapErr().message);
      }

      return {
        status: 200,
        streamed: {
          updatedArticle: shouldRefresh
            ? unwrapPromise(cacheService.getUpdatedReadableArticle(article.slug, article.link))
            : undefined
        },
        readableArticle: cachedReadableArticle,
        articleMetadata: article,
        error: undefined
      };
    },
    err: (err) => {
      error(500, err.message);
    }
  });
};
