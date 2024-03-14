import type { RequestHandler } from '@sveltejs/kit';
import boardRepository from '@/server/data/repositories/board';
import rssFeedRepository from '@/server/data/repositories/rssFeed';
import { createBoardDto, updateBoardDto } from '@/server/dto/boardDto';
import { lucia } from '@/server/services/auth';
import type { Board } from '@/server/data/schema';
import type { UpdateRssFeedDto } from '@/server/dto/rssFeedDto';

export const GET: RequestHandler = async ({ url }) => {
	const boardSlug = url.searchParams.get('slug');

	if (!boardSlug || boardSlug.length !== 8) {
		return new Response('Invalid board slug', { status: 400 });
	}

	const board = await boardRepository.findBySlug(boardSlug);

	if (!board) {
		return new Response('Board not found', { status: 404 });
	}

	return new Response(JSON.stringify(board), { status: 200 });
};

export const POST: RequestHandler = async ({ request }) => {
	const requestBody = await request.json();

	if (!requestBody) {
		return new Response('Missing body', { status: 400 });
	}

	const cookieHeader = request.headers.get('Cookie');
	if (!cookieHeader) {
		return new Response('Unauthorized', { status: 401 });
	}

	const sessionId = lucia.readSessionCookie(cookieHeader);
	if (!sessionId) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (!session || !user || session.expiresAt < new Date()) {
		return new Response('Unauthorized', { status: 401 });
	}

	const validationResult = createBoardDto.safeParse(requestBody);
	if (!validationResult.success) {
		return new Response(JSON.stringify(validationResult.error), { status: 400 });
	}

	const createdBoard = await boardRepository.create({
		name: requestBody.name,
		userId: user.id
	});

	return new Response(JSON.stringify(createdBoard), { status: 200 });
};

export const PATCH: RequestHandler = async ({ request }) => {
	const requestBody = await request.json();

	if (!requestBody) {
		return new Response('Missing body', { status: 400 });
	}

	const cookieHeader = request.headers.get('Cookie');

	if (!cookieHeader) {
		return new Response('Unauthorized', { status: 401 });
	}

	const sessionId = lucia.readSessionCookie(cookieHeader);

	if (!sessionId) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { session, user } = await lucia.validateSession(sessionId);

	if (!session || !user || session.expiresAt < new Date()) {
		return new Response('Unauthorized', { status: 401 });
	}

	const validationResult = updateBoardDto.safeParse(requestBody);

	if (!validationResult.success) {
		return new Response(JSON.stringify(validationResult.error), { status: 400 });
	}

	const { data } = validationResult;

	const boardToUpdate: Pick<Board, 'name'> = {
		name: data.name
	};

	try {
		await Promise.all([
			boardRepository.update(data.id, boardToUpdate),
			data.rssFeeds
				? Promise.all(
						data.rssFeeds.map((rssFeed) => {
							const hasId = (feed: typeof rssFeed): feed is UpdateRssFeedDto => 'id' in feed;

							if (hasId(rssFeed)) {
								return rssFeedRepository.update(rssFeed.id, rssFeed);
							} else {
								return rssFeedRepository.create(rssFeed, data.id);
							}
						})
					)
				: []
		]);

		return new Response(JSON.stringify({ message: 'Board updated successfully' }), { status: 200 });
	} catch (error) {
		return new Response(JSON.stringify('Something went wrong'), { status: 500 });
	}
};
