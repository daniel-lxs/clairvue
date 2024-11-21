import type { RequestHandler } from '@sveltejs/kit';
import { countArticles } from '@/server/services/article.service';
import { validateAuthSession } from '@/server/services/auth.service';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const boardId = url.searchParams.get('boardId') || undefined;
  const feedId = url.searchParams.get('feedId') || undefined;
  const afterPublishedAt = url.searchParams.get('afterPublishedAt');

  if (!afterPublishedAt) {
    return new Response('Invalid request', { status: 400 });
  }

  const authSession = await validateAuthSession(cookies);
  if (
    !authSession ||
    !authSession.session ||
    !authSession.user ||
    authSession.session.expiresAt < new Date()
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  let afterPublishedAtDate: Date;
  try {
    afterPublishedAtDate = new Date(afterPublishedAt);
  } catch (error) {
    afterPublishedAtDate = new Date();
  }

  const articles = await countArticles(afterPublishedAtDate, feedId, boardId);
  return new Response(JSON.stringify(articles), { status: 200 });
};
