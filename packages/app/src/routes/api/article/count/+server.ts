import type { RequestHandler } from '@sveltejs/kit';
import articleService from '@/server/services/article.service';
import { z } from 'zod';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const collectionId = url.searchParams.get('collectionId') || undefined;
  const feedId = url.searchParams.get('feedId') || undefined;
  const afterPublishedAt = url.searchParams.get('afterPublishedAt');

  let afterPublishedAtDate: Date | undefined;
  if (afterPublishedAt && z.string().datetime().safeParse(afterPublishedAt).success === true) {
    afterPublishedAtDate = new Date(afterPublishedAt);
  }

  if (collectionId) {
    const articlesResult = await articleService.countArticlesByCollectionId(
      collectionId,
      afterPublishedAtDate
    );

    return articlesResult.match({
      ok: (count) => new Response(JSON.stringify({ count }), { status: 200 }),
      err: (error) => new Response(error.message, { status: 500 })
    });
  } else if (feedId) {
    const articlesResult = await articleService.countArticlesByFeedId(feedId, afterPublishedAtDate);

    return articlesResult.match({
      ok: (count) => new Response(JSON.stringify({ count }), { status: 200 }),
      err: (error) => new Response(error.message, { status: 500 })
    });
  } else {
    return new Response('Missing required parameters: collectionId or feedId', { status: 400 });
  }
};
