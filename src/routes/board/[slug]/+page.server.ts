import boardRepository from '@/server/data/repositories/board';
import articlesRepository from '@/server/data/repositories/article';

export async function load({ params }) {
	const slug = params.slug;
	const board = await boardRepository.findBySlug(slug, true);

	if (!board) {
		return {
			board: undefined,
			articles: undefined
		};
	}
	//TODO: good idea here
	//const articles = await boardRepository.getArticlesByBoardId(board.id);

	//for now we only have one rss feed
	const articles = await articlesRepository.findByBoardId(board.id);

	return {
		board,
		articles
	};
}
