import type { RequestHandler } from '@sveltejs/kit';
import feedRepository from '@/server/data/repositories/feed';
import { createFeedDto, updateFeedDto, type CreateFeedDto } from '@/server/dto/feedDto';
import type { CreateFeedResult } from '@/types/CreateFeedResult';
import type { Feed } from '@/server/data/schema';
import { getArticleQueue } from '@/server/queue/articles';

export const GET: RequestHandler = async ({ url }) => {
  const feedId = url.searchParams.get('id');

  if (!feedId || feedId.length !== 8) {
    return new Response('Invalid Feed ID', { status: 400 });
  }

  const feed = await feedRepository.findById(feedId);

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
        return { result: 'error', data: null, reason: result.error.message };
      }

      const newFeedData = { ...result.data, description: result.data.description || null };

      try {
        const createdFeed = await feedRepository.create(newFeedData);

        if (!createdFeed) {
          return { result: 'error', data: null, reason: 'Unable to create' };
        }

        const articleQueue = getArticleQueue();

        articleQueue?.add(
          'sync',
          { feedId: createdFeed.id },
          {
            jobId: createdFeed.id,
            removeOnComplete: true,
            removeOnFail: true
          }
        );

        return { result: 'success', data: createdFeed, reason: null };
      } catch (error) {
        return { result: 'error', data: null, reason: 'Internal error' };
      }
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
    await feedRepository.update(validationResult.data.id, feedToUpdate);
  } catch (error) {
    return new Response(JSON.stringify('Something went wrong'), { status: 500 });
  }

  return new Response(JSON.stringify(' Feed updated successfully'), { status: 200 });
};
