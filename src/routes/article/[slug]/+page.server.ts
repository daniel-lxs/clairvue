import { findBySlug as findArticleBySlug } from '@/server/services/article.service';
import { redirect } from '@sveltejs/kit';
import { parseReadableArticle } from '@/server/services/article.service';
import { getCachedArticle } from '@/server/services/cache.service';
import { getArticleCacheQueue } from '@/server/queue/articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const slug = params.slug;
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36';

  const article = await findArticleBySlug(slug);

  if (!article) {
    return {
      status: 404,
      article: undefined,
      streamed: { parsedArticle: undefined },
      error: 'Article not found'
    };
  }

  if (!article.readable) {
    redirect(302, article.link);
  }

  // Try to get the article from cache first
  const cachedArticle = await getCachedArticle(slug);

  // If not in cache, parse it and queue caching job
  if (!cachedArticle) {
    const queue = getArticleCacheQueue();
    await queue.add(
      'cache-article',
      { slug, url: article.link },
      { removeOnComplete: true, removeOnFail: true }
    );
  }

  return {
    status: 200,
    streamed: {
      parsedArticle: cachedArticle
        ? Promise.resolve(cachedArticle)
        : parseReadableArticle(article.link, userAgent)
    },
    article,
    error: undefined
  };
};
