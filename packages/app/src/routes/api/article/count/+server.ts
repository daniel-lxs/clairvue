import type { RequestHandler } from '@sveltejs/kit';
import articleService from '@/server/services/article.service';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const collectionId = url.searchParams.get('collectionId') || undefined;
  const feedId = url.searchParams.get('feedId') || undefined;
  const afterPublishedAt = url.searchParams.get('afterPublishedAt');

  if (!afterPublishedAt) {
    return new Response('Missing required parameters: afterPublishedAt', { status: 400 });
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
