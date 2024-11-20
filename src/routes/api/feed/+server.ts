import type { RequestHandler } from '@sveltejs/kit';
import { findFeedById, createFeed, updateFeed } from '@/server/services/feed.service';
import { createFeedDto, updateFeedDto, type CreateFeedDto } from '@/server/dto/feed.dto';
import type { CreateFeedResult } from '@/types/CreateFeedResult';
import type { Feed } from '@/server/data/schema';

export const GET: RequestHandler = async ({ url }) => {
  const feedId = url.searchParams.get('id');

  if (!feedId || feedId.length !== 8) {
    return new Response('Invalid Feed ID', { status: 400 });
  }

  const feed = await findFeedById(feedId);

  if (!feed) {
    return new Response('Feed not found', { status: 404 });
  }

  return new Response(JSON.stringify(feed), { status: 200 });
};

export const POST: RequestHandler = async ({ request }) => {
  const requestBody: CreateFeedDto[] = await request.json();

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
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

      return await createFeed(result.data);
    })
  );

  return new Response(JSON.stringify(newFeeds), { status: 200 });
};

export const PATCH: RequestHandler = async ({ request }) => {
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

  try {
    await updateFeed(validationResult.data.id, feedToUpdate);
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error updating feed:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
