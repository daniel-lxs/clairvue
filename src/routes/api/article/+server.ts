import type { RequestHandler } from '@sveltejs/kit';
import articleRepository from '@/server/data/repositories/article';

export const GET: RequestHandler = async ({ url }) => {
	const boardId = url.searchParams.get('boardId');
	let take = Number(url.searchParams.get('take'));
	const afterPublishedAt = url.searchParams.get('afterPublishedAt') || undefined;
	const rssFeedId = url.searchParams.get('rssFeedId');

	if (boardId) {
		if (isNaN(take)) {
			take = 5;
		}

		const articles = await articleRepository.findByBoardId(boardId, afterPublishedAt, take);
		return new Response(JSON.stringify(articles), { status: 200 });
	}

	if (rssFeedId) {
		const articles = await articleRepository.findByRssFeedId(rssFeedId);
		return new Response(JSON.stringify(articles), { status: 200 });
	}

	return new Response('Invalid request', { status: 400 });
};
