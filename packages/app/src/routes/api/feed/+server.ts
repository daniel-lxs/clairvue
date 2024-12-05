import type { RequestHandler } from '@sveltejs/kit';
import feedService from '@/server/services/feed.service';
import { createFeedsDto, updateFeedDto, type CreateFeedDto } from '@/server/dto/feed.dto';
import type { Feed } from '@/server/data/schema';
import authService from '@/server/services/auth.service';
import { Result } from '@clairvue/types';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const feedSlug = url.searchParams.get('slug');
  const collectionSlug = url.searchParams.get('collectionSlug');

  if (!feedSlug || !collectionSlug) {
    return new Response('Invalid feed or collection slug', { status: 400 });
  }

  const authSessionResult = await authService.validateAuthSession(cookies);

  if (authSessionResult.isOk()) {
    const authSession = authSessionResult.unwrap();
    if (!authSession || !authSession.user) {
      return new Response('Unauthorized', { status: 401 });
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
  }

  return new Response('Internal server error', { status: 500 });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  const requestBody: CreateFeedDto[] = await request.json();

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
  }

  const authSessionResult = await authService.validateAuthSession(cookies);

  if (authSessionResult.isOk()) {
    const authSession = authSessionResult.unwrap();
    if (!authSession || !authSession.user) {
      return new Response('Unauthorized', { status: 401 });
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
  }

  return new Response('Internal server error', { status: 500 });
};

export const PATCH: RequestHandler = async ({ request, cookies }) => {
  const requestBody = await request.json();

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
  }

  const authSessionResult = await authService.validateAuthSession(cookies);

  if (authSessionResult.isOk()) {
    const authSession = authSessionResult.unwrap();
    if (!authSession || !authSession.user) {
      return new Response('Unauthorized', { status: 401 });
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
  }

  return new Response('Internal server error', { status: 500 });
};
