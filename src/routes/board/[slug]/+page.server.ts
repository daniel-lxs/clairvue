import boardRepository from '@/server/data/repositories/board';
import articlesRepository from '@/server/data/repositories/article';

export async function load({ params: { slug } }) {
	const board = await boardRepository.findBySlug(slug, true);

	if (!board) {
		return {
			board: undefined,
			articles: undefined,
			page: undefined
		};
	}

	const articles = await articlesRepository.findByBoardId(board.id, 0, 20);

	return {
		board,
		articles
	};
}
