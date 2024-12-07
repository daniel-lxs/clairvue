import { redirect } from '@sveltejs/kit';
import articleService from '@/server/services/article.service';
import cacheService from '@/server/services/cache.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
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
      const cachedReadableArticle = await cacheService.getCachedReadableArticle(article.link);

      return {
        status: 200,
        streamed: {
          updatedArticle: cacheService.getUpdatedReadableArticle(article.slug, article.link)
        },
        readableArticle: cachedReadableArticle,
        articleMetadata: article,
        error: undefined
      };
    },
    err: (error) => {
      return {
        status: 500,
        error: `Error fetching article: ${error.message}`,
        readableArticle: undefined,
        articleMetadata: undefined,
        streamed: undefined
      };
    }
  });
};
