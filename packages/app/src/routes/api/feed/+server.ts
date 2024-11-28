import type { RequestHandler } from '@sveltejs/kit';
import feedService from '@/server/services/feed.service';
import { createFeedDto, updateFeedDto, type CreateFeedDto } from '@/server/dto/feed.dto';
import type { CreateFeedResult } from '@clairvue/types';
import type { Feed } from '@/server/data/schema';
import { validateAuthSession } from '@/server/services/auth.service';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const feedSlug = url.searchParams.get('slug');
    const collectionSlug = url.searchParams.get('collectionSlug');

    if (!feedSlug || !collectionSlug) {
      return new Response('Invalid feed or collection slug', { status: 400 });
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

    const feed = await feedService.findBySlug(feedSlug);

    if (!feed) {
      return new Response('Feed not found', { status: 404 });
    }

    return new Response(JSON.stringify(feed), { status: 200 });
  } catch (error) {
    console.error('Error occurred on GET /api/feed', error);
    return new Response('Internal server error', { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const requestBody: CreateFeedDto[] = await request.json();

    if (!requestBody) {
      return new Response('Missing body', { status: 400 });
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

    const validationResults = requestBody.map((feed) => createFeedDto.safeParse(feed));

    if (validationResults.some((result) => result.success === false)) {
      return new Response(
        JSON.stringify(validationResults.filter((result) => result.success === false)),
        { status: 400 }
      );
    }

    const newFeeds: CreateFeedResult[] = await Promise.all(
      requestBody.map(async (feed) => {
        const result = createFeedDto.safeParse(feed);

        if (!result.success) {
          return { result: 'error', reason: result.error.message };
        }

        return await feedService.createFeed(result.data, authSession.user.id);
      })
    );

    return new Response(JSON.stringify(newFeeds), { status: 200 });
  } catch (error) {
    console.error('Error occurred while creating feeds:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request, cookies }) => {
  try {
    const requestBody = await request.json();

    if (!requestBody) {
      return new Response('Missing body', { status: 400 });
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

    await feedService.updateFeed(validationResult.data.id, feedToUpdate);
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error updating feed:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
