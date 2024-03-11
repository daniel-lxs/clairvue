import boardRepository from '@/server/data/repositories/board';
import articlesRepository from '@/server/data/repositories/article';

export async function load({ params: { slug }, url: { searchParams } }) {
	const page = searchParams.get('p') ?? '1';
	const parsedPage = parseInt(page) ?? 1;

	const board = await boardRepository.findBySlug(slug, true);

	if (!board) {
		return {
			board: undefined,
			articles: undefined,
			page: undefined
		};
	}

	const articles = await articlesRepository.findByBoardId(board.id, parsedPage);

	return {
		board,
		articles,
		page: parsedPage
	};
}
