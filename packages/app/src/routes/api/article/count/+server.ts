import type { RequestHandler } from '@sveltejs/kit';
import articleService from '@/server/services/article.service';
import authService from '@/server/services/auth.service';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const collectionId = url.searchParams.get('collectionId') || undefined;
  const feedId = url.searchParams.get('feedId') || undefined;
  const afterPublishedAt = url.searchParams.get('afterPublishedAt');

  if (!afterPublishedAt) {
    return new Response('Missing required parameters: afterPublishedAt', { status: 400 });
  }

  const authSessionResult = await authService.validateAuthSession(cookies);

  if (authSessionResult.isErr()) {
    return new Response('Internal server error', { status: 500 });
  } else {
    const authSession = authSessionResult.unwrap();
    if (!authSession) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let afterPublishedAtDate: Date;
  try {
    afterPublishedAtDate = new Date(afterPublishedAt);
  } catch (error) {
    afterPublishedAtDate = new Date();
  }

  const articles = await articleService.countArticles(afterPublishedAtDate, feedId, collectionId);

  return articles.match({
    ok: (count) => new Response(JSON.stringify({ count }), { status: 200 }),
    err: (error) => new Response(error.message, { status: 500 })
  });
};
