import type { RequestHandler } from '@sveltejs/kit';
import feedService from '@/server/services/feed.service';
import { createFeedsDto, updateFeedDto, type CreateFeedDto } from '@/server/dto/feed.dto';

import { Result, type Feed } from '@clairvue/types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const feedSlug = url.searchParams.get('slug');

  if (!feedSlug) {
    return new Response('Invalid feed slug', { status: 400 });
  }

  const feedResult = await feedService.findBySlug(feedSlug);

  return feedResult.match({
    ok: (feed) => {
      if (!feed) {
        return new Response('Feed not found', { status: 404 });
      }
      return new Response(JSON.stringify(feed), { status: 200 });
    },
    err: (error) => {
      return new Response(error.message, { status: 500 });
    }
  });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const requestBody: CreateFeedDto[] = await request.json();

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
  }

  const validationResults = createFeedsDto.safeParse(requestBody);

  if (!validationResults.success) {
    return new Response(JSON.stringify(validationResults.error), { status: 400 });
  }

  const newFeedsResult: Result<Feed, Error>[] = await Promise.all(
    validationResults.data.map(async (feed) => {
      return await feedService.createFeed(feed, authSession.user!.id);
    })
  );

  const errors = newFeedsResult.filter((result) => result.isErr());

  if (errors.length > 0) {
    return new Response(JSON.stringify([...errors.map((e) => e.unwrapErr())]), { status: 400 });
  }

  return new Response(JSON.stringify([...newFeedsResult.map((r) => r.unwrap())]), {
    status: 200
  });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const requestBody = await request.json();

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
  }

  const validationResult = updateFeedDto.safeParse(requestBody);

  if (!validationResult.success) {
    return new Response(JSON.stringify(validationResult.error), { status: 400 });
  }

  const { data } = validationResult;

  const feedToUpdate: Pick<Feed, 'name' | 'link' | 'description'> = {
    name: data.name,
    link: data.link,
    description: data.description || null
  };

  const updateResult = await feedService.updateFeed(validationResult.data.id, feedToUpdate);

  return updateResult.match({
    ok: (feed) => {
      return new Response(JSON.stringify(feed), { status: 200 });
    },
    err: (error) => {
      return new Response(error.message, { status: 500 });
    }
  });
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const feedId = url.searchParams.get('feedId');

  if (!feedId) {
    return new Response('Missing feed ID', { status: 400 });
  }

  const deleteResult = await feedService.deleteForUser(authSession.user.id, feedId);

  return deleteResult.match({
    ok: () => new Response('OK', { status: 200 }),
    err: (error) => new Response(error.message, { status: 500 })
  });
};
