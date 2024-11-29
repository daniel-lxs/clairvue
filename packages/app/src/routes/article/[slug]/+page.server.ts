import { redirect } from '@sveltejs/kit';
import articleService from '@/server/services/article.service';
import cacheService from '@/server/services/cache.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const slug = params.slug;

  const article = await articleService.findBySlug(slug);

  if (!article) {
    return {
      status: 404,
      error: 'Article not found',
      readableArticle: undefined,
      articleMetadata: undefined
    };
  }

  if (!article.readable) {
    redirect(302, article.link);
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
};
