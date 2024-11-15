import articleRepository from '@/server/data/repositories/article';
import { redirect } from '@sveltejs/kit';
import { parseReadableArticle } from '@/server/services/article';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const slug = params.slug;
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36';

  const article = await articleRepository.findBySlug(slug);

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

  return {
    status: 200,
    streamed: { parsedArticle: parseReadableArticle(article.link, userAgent) },
    article,
    error: undefined
  };
};
