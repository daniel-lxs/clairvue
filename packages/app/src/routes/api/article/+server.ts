import type { RequestHandler } from '@sveltejs/kit';
import articlesService from '@/server/services/article.service';
import { getArticleMetadataQueue, getQueueEvents } from '@/server/queue/articles';
import { hashString, normalizeError } from '$lib/utils';
import { z } from 'zod';
import articleService from '@/server/services/article.service';

export const GET: RequestHandler = async ({ url, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const collectionId = url.searchParams.get('collectionId');
  let take = Number(url.searchParams.get('take'));
  const beforePublishedAt = url.searchParams.get('beforePublishedAt');
  const feedId = url.searchParams.get('feedId');

  if (!beforePublishedAt || z.string().datetime().safeParse(beforePublishedAt).success === false) {
    return new Response('Invalid beforePublishedAt', { status: 400 });
  }

  if (collectionId) {
    if (isNaN(take)) {
      take = 5;
    }

    const articlesResult = await articlesService.findByCollectionIdWithInteractions(
      collectionId,
      authSession.user.id,
      beforePublishedAt,
      take
    );

    return articlesResult.match({
      ok: (articles) => {
        if (articles) {
          return new Response(
            JSON.stringify({
              items: articles.items,
              totalCount: articles.totalCount
            }),
            { status: 200 }
          );
        }
        return new Response('Articles not found', { status: 404 });
      },
      err: (error) => new Response(error.message, { status: 500 })
    });
  }

  if (feedId) {
    const articlesResult = await articlesService.findByFeedIdWithInteractions(
      feedId,
      authSession.user.id,
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

  return new Response('Invalid request', { status: 400 });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { title, feedId, url, makeReadable } = await request.json();

  if (!url || !feedId) {
    return new Response('Invalid request', { status: 400 });
  }

  if (z.string().url().safeParse(url).success === false) {
    return new Response('Invalid url', { status: 400 });
  }

  try {
    const articleMetadataQueue = getArticleMetadataQueue();
    const queueName = articleMetadataQueue.name;
    const ttl = 1000 * 60 * 1; // 1 minute
    const job = await articleMetadataQueue.add(
      'import-article',
      { title, url, makeReadable },
      {
        deduplication: {
          id: hashString(url)
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    );

    const jobResult = await job.waitUntilFinished(getQueueEvents(queueName), ttl);

    const result = await articleService.processArticlesFromJob(feedId, [jobResult]);

    return result.match({
      ok: (slugs) => new Response(JSON.stringify(slugs), { status: 200 }),
      err: (error) => new Response(error.message, { status: 500 })
    });
  } catch (e) {
    const error = normalizeError(e);
    return new Response(error.message, { status: 500 });
  }
};
