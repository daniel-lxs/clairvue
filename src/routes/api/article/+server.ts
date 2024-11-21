import type { RequestHandler } from '@sveltejs/kit';
import { findArticlesByBoardId, findArticlesByFeedId } from '@/server/services/article.service';
import { validateAuthSession } from '@/server/services/auth.service';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const boardId = url.searchParams.get('boardId');
  let take = Number(url.searchParams.get('take'));
  const beforePublishedAt = url.searchParams.get('beforePublishedAt') || undefined;
  const feedId = url.searchParams.get('feedId');

  const authSession = await validateAuthSession(cookies);
  if (
    !authSession ||
    !authSession.session ||
    !authSession.user ||
    authSession.session.expiresAt < new Date()
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (boardId) {
    if (isNaN(take)) {
      take = 5;
    }

    const articles = await findArticlesByBoardId(boardId, beforePublishedAt, take);
    return new Response(JSON.stringify(articles), { status: 200 });
  }

  if (feedId) {
    const articles = await findArticlesByFeedId(feedId, beforePublishedAt, take);
    return new Response(JSON.stringify(articles), { status: 200 });
  }

  return new Response('Invalid request', { status: 400 });
};
