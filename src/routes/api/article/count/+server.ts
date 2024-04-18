import type { RequestHandler } from '@sveltejs/kit';
import articleRepository from '@/server/data/repositories/article';

export const GET: RequestHandler = async ({ url }) => {
  const boardId = url.searchParams.get('boardId') || undefined;
  const feedId = url.searchParams.get('feedId') || undefined;
  const beforePublishedAt = url.searchParams.get('beforePublishedAt');

  if (!beforePublishedAt) {
    return new Response('Invalid request', { status: 400 });
  }

  let afterPublishedAtDate: Date;
  try {
    afterPublishedAtDate = new Date(beforePublishedAt);
  } catch (error) {
    afterPublishedAtDate = new Date();
  }

  const articles = await articleRepository.countArticles(afterPublishedAtDate, feedId, boardId);
  return new Response(JSON.stringify(articles), { status: 200 });
};
