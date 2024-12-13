import type { RequestHandler } from '@sveltejs/kit';
import articlesService from '@/server/services/article.service';
import { createArticleDto } from '@/server/dto/article.dto';
import { getArticleMetadataQueue, getQueueEvents } from '@/server/queue/articles';
import { hashString, normalizeError } from '$lib/utils';
import { z } from 'zod';
import feedService from '$lib/server/services/feed.service';

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

  const parsedBeforePublishedAt = new Date(beforePublishedAt);

  if (collectionId) {
    if (isNaN(take)) {
      take = 5;
    }

    const feedsResult = await feedService.findByCollectionIdWithArticles(
      collectionId,
      parsedBeforePublishedAt,
      take
    );

    return feedsResult.match({
      ok: (feeds) => {
        if (feeds) {
          const articles = feeds.flatMap((feed) => feed.articles);
          return new Response(JSON.stringify(articles), { status: 200 });
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

    const result = await job.waitUntilFinished(getQueueEvents(queueName), ttl);

    const { success, data: validationData, error } = createArticleDto.safeParse(result);
    if (!success) {
      return new Response(JSON.stringify(error), { status: 400 });
    }

    const articleExistsResult = await articlesService.existsWithLink(validationData.link);

    if (articleExistsResult.isOkAnd((exists) => exists)) {
      return new Response('Article already exists', { status: 400 });
    }

    const articleResult = await articlesService.create(
      [
        {
          ...validationData,
          description: validationData.description ?? null,
          image: validationData.image ?? null,
          author: validationData.author ?? null
        }
      ],
      feedId
    );

    return articleResult.match({
      ok: (slugs) => new Response(JSON.stringify(slugs), { status: 200 }),
      err: (error) => new Response(error.message, { status: 500 })
    });
  } catch (e) {
    const error = normalizeError(e);
    return new Response(error.message, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request, locals }) => {
  // Allow for the user to add the article to their saved articles feed
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { articleId } = await request.json();

  if (!articleId) {
    return new Response('Invalid request', { status: 400 });
  }

  const result = await articlesService.addToSavedArticles(articleId, authSession.user.id);

  return result.match({
    ok: () => new Response('Article added to saved articles', { status: 200 }),
    err: (error) => new Response(error.message, { status: 500 })
  });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { articleId } = await request.json();

  if (!articleId) {
    return new Response('Invalid request', { status: 400 });
  }

  const result = await articlesService.removeFromSavedArticles(articleId, authSession.user.id);

  return result.match({
    ok: () => new Response('Article removed from saved articles', { status: 200 }),
    err: (error) => new Response(error.message, { status: 500 })
  });
};
