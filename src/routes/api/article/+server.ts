import type { RequestHandler } from '@sveltejs/kit';
import articleRepository from '@/data/repositories/article';

export const GET: RequestHandler = async ({ url }) => {
	const boardId = url.searchParams.get('boardId');
	const page = url.searchParams.get('page');
	const rssFeedId = url.searchParams.get('rssFeedId');

	if (boardId) {
		const parsedPage = page ? parseInt(page) : 1;
		if (isNaN(parsedPage)) {
			return new Response('Invalid page number', { status: 400 });
		}
		const articles = await articleRepository.findByBoardId(boardId, parsedPage);
		return new Response(JSON.stringify(articles), { status: 200 });
	}

	if (rssFeedId) {
		//TODO: implement pagination
		/*const parsedPage = page ? parseInt(page) : 1;
    if(isNaN(parsedPage)){
      return new Response('Invalid page number', { status: 400 });
    }*/
		const articles = await articleRepository.findByRssFeedId(rssFeedId);
		return new Response(JSON.stringify(articles), { status: 200 });
	}

	return new Response('Invalid request', { status: 400 });
};
