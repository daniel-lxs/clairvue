import type { RequestHandler } from '@sveltejs/kit';
import rssFeedRepository from '@/data/repositories/rssFeed';
import { createRssFeedDto, updateRssFeedDto, type CreateRssFeedDto } from '@/dto/rssFeedDto';
import type { CreateRssFeedResult } from '@/types/CreateRssFeedResult';
import { syncArticles } from '@/data/services/article';

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
	const validationResults = requestBody.map((rssFeed) => createRssFeedDto.safeParse(rssFeed));

	if (!validationResults.every((result) => result.success)) {
		return new Response(JSON.stringify(validationResults), { status: 400 });
	}

	const newRssFeeds: CreateRssFeedResult[] = [];

	//TODO: improve response
	for (const result of validationResults) {
		try {
			if (!result.success) {
				newRssFeeds.push({ result: 'error', data: null, reason: result.error.message });
				continue;
			}
			const { boardId, ...newRssFeedData } = result.data;
			const createdRssFeed = await rssFeedRepository.create(newRssFeedData, boardId);
			if (!createdRssFeed) {
				newRssFeeds.push({ result: 'error', data: null, reason: 'Unable to create' });
				continue;
			}
			syncArticles(createdRssFeed, true);
			newRssFeeds.push({ result: 'success', data: createdRssFeed, reason: null });
		} catch (error) {
			newRssFeeds.push({ result: 'error', data: null, reason: 'Internal error' });
		}
	}

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

	try {
		await rssFeedRepository.update(validationResult.data);
	} catch (error) {
		return new Response(JSON.stringify('Something went wrong'), { status: 500 });
	}

	return new Response(JSON.stringify('RSS Feed updated successfully'), { status: 200 });
};
