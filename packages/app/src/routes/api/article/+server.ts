import type { RequestHandler } from '@sveltejs/kit';
import articlesService from '@/server/services/article.service';

export const GET: RequestHandler = async ({ url, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const collectionId = url.searchParams.get('collectionId');
  let take = Number(url.searchParams.get('take'));
  const beforePublishedAt = url.searchParams.get('beforePublishedAt') || undefined;
  const feedId = url.searchParams.get('feedId');

  if (collectionId) {
    if (isNaN(take)) {
      take = 5;
    }

    const articlesResult = await articlesService.findByCollectionId(
      collectionId,
      beforePublishedAt,
      take
    );
    return articlesResult.match({
      ok: (articles) => {
        if (articles) {
          return new Response(JSON.stringify(articles), { status: 200 });
        }
        return new Response('Articles not found', { status: 404 });
      },
      err: (error) => new Response(error.message, { status: 500 })
    });
  }

  if (feedId) {
    const articlesResult = await articlesService.findByFeedId(feedId, beforePublishedAt, take);
    return articlesResult.match({
      ok: (articles) => {
        if (articles) {
          return new Response(JSON.stringify(articles), { status: 200 });
        }
        return new Response('Articles not found', { status: 404 });
      },
      err: (error) => new Response(error.message, { status: 500 })
    });
  }

  return new Response('Invalid request', { status: 400 });
};
