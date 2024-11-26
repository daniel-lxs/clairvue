import type { RequestHandler } from '@sveltejs/kit';
import articleService from '@/server/services/article.service';
import { validateAuthSession } from '@/server/services/auth.service';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const collectionId = url.searchParams.get('collectionId') || undefined;
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

  const articles = await articleService.countArticles(afterPublishedAtDate, feedId, collectionId);
  return new Response(JSON.stringify(articles), { status: 200 });
};
