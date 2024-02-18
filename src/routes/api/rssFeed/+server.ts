import type { RequestHandler } from '@sveltejs/kit';
import rssFeedRepository from '@/data/repository/rssFeed';
import { createRssFeedDto, updateRssFeedDto } from '@/dto/rssFeedDto';

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
	const requestBody = await request.json();

	if (!requestBody) {
		return new Response('Missing body', { status: 400 });
	}

	const validationResult = createRssFeedDto.safeParse(requestBody);

	if (!validationResult.success) {
		return new Response(JSON.stringify(validationResult.error), { status: 400 });
	}

	const { boardId, ...newRssFeedData } = validationResult.data;

	const createdRssFeed = await rssFeedRepository.create(newRssFeedData, boardId);

	return new Response(JSON.stringify(createdRssFeed), { status: 200 });
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
