import type { RequestHandler } from '@sveltejs/kit';
import articleRepository from '@/server/data/repositories/article';

export const GET: RequestHandler = async ({ url }) => {
  const boardId = url.searchParams.get('boardId');
  let take = Number(url.searchParams.get('take'));
  const beforePublishedAt = url.searchParams.get('beforePublishedAt') || undefined;
  const feedId = url.searchParams.get('feedId');

  if (boardId) {
    if (isNaN(take)) {
      take = 5;
    }

    const articles = await articleRepository.findByBoardId(boardId, beforePublishedAt, take);
    return new Response(JSON.stringify(articles), { status: 200 });
  }

  if (feedId) {
    const articles = await articleRepository.findByFeedId(feedId);
    return new Response(JSON.stringify(articles), { status: 200 });
  }

  return new Response('Invalid request', { status: 400 });
};
