import articleRepository from '@/server/data/repositories/article';
import { redirect } from '@sveltejs/kit';
import { parseReadableArticle } from '@/server/services/article';
import type { PageServerLoad } from './$types';
import { PUBLIC_USER_AGENT } from '$env/static/public';

export const load: PageServerLoad = async ({ params }) => {
  const slug = params.slug;
  const userAgent = PUBLIC_USER_AGENT;

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
