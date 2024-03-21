import type { RequestHandler } from '@sveltejs/kit';
import rssFeedRepository from '@/server/data/repositories/rssFeed';
import { createRssFeedDto, updateRssFeedDto, type CreateRssFeedDto } from '@/server/dto/rssFeedDto';
import type { CreateRssFeedResult } from '@/types/CreateRssFeedResult';
import { syncArticles } from '@/server/services/article';
import type { RssFeed } from '@/server/data/schema';

export const GET: RequestHandler = async ({ url }) => {
	const rssFeedId = url.searchParams.get('id');

	if (!rssFeedId || rssFeedId.length !== 8) {
		return new Response('Invalid RSS Feed ID', { status: 400 });
	}

	const rssFeed = await rssFeedRepository.findById(rssFeedId);

	if (!rssFeed) {
		return new Response('RSS Feed not found', { status: 404 });
	}

	return new Response(JSON.stringify(rssFeed), { status: 200 });
};

export const POST: RequestHandler = async ({ request }) => {
	const requestBody: CreateRssFeedDto[] = await request.json();

	if (!requestBody) {
		return new Response('Missing body', { status: 400 });
	}

	const validateRequestBody = (requestBody: CreateRssFeedDto[]): boolean => {
		const validationResults = requestBody.map((rssFeed) => createRssFeedDto.safeParse(rssFeed));
		return validationResults.every((result) => result.success);
	};

	if (!validateRequestBody(requestBody)) {
		return new Response('Invalid request body', { status: 400 });
	}

	const newRssFeeds: CreateRssFeedResult[] = await Promise.all(
		requestBody.map(async (rssFeed) => {
			const result = createRssFeedDto.safeParse(rssFeed);

			if (!result.success) {
				return { result: 'error', data: null, reason: result.error.message };
			}

			const newRssFeedData = result.data;

			try {
				const createdRssFeed = await rssFeedRepository.create(newRssFeedData);

				if (!createdRssFeed) {
					return { result: 'error', data: null, reason: 'Unable to create' };
				}

				syncArticles(createdRssFeed);

				return { result: 'success', data: createdRssFeed, reason: null };
			} catch (error) {
				return { result: 'error', data: null, reason: 'Internal error' };
			}
		})
	);

	return new Response(JSON.stringify(newRssFeeds), { status: 200 });
};

export const PATCH: RequestHandler = async ({ request }) => {
	const requestBody = await request.json();

	if (!requestBody) {
		return new Response('Missing body', { status: 400 });
	}

	const validationResult = updateRssFeedDto.safeParse(requestBody);

	if (!validationResult.success) {
		return new Response(JSON.stringify(validationResult.error), { status: 400 });
	}

	const { data } = validationResult;

	const feedToUpdate: Pick<RssFeed, 'name' | 'link' | 'description'> = {
		name: data.name,
		link: data.link,
		description: data.description
	};

	try {
		await rssFeedRepository.update(validationResult.data.id, feedToUpdate);
	} catch (error) {
		return new Response(JSON.stringify('Something went wrong'), { status: 500 });
	}

	return new Response(JSON.stringify('RSS Feed updated successfully'), { status: 200 });
};
