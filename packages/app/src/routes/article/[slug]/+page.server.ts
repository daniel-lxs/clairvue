import { redirect } from '@sveltejs/kit';
import articleService from '@/server/services/article.service';
import cacheService from '@/server/services/cache.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const slug = params.slug;
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36';

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

  // Try to get the article from cache first
  const cachedReadableArticle = await cacheService.getCachedReadableArticle(slug);

  return {
    status: 200,
    streamed: {
      updatedArticle: cacheService.getUpdatedReadableArticle(slug, article.link)
    },
    readableArticle: cachedReadableArticle,
    articleMetadata: article,
    error: undefined
  };
};
