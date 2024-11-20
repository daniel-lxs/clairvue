import type { RequestHandler } from '@sveltejs/kit';
import articleRepository from '@/server/data/repositories/article.repository';

export const GET: RequestHandler = async ({ url }) => {
  const boardId = url.searchParams.get('boardId') || undefined;
  const feedId = url.searchParams.get('feedId') || undefined;
  const afterPublishedAt = url.searchParams.get('afterPublishedAt');

  if (!afterPublishedAt) {
    return new Response('Invalid request', { status: 400 });
  }

  let afterPublishedAtDate: Date;
  try {
    afterPublishedAtDate = new Date(afterPublishedAt);
  } catch (error) {
    afterPublishedAtDate = new Date();
  }

  const articles = await articleRepository.countArticles(afterPublishedAtDate, feedId, boardId);
  return new Response(JSON.stringify(articles), { status: 200 });
};
