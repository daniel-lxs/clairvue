import type { Article } from '@/server/data/schema';
import type { PaginatedList } from '@/types/PaginatedList';

export async function getArticlesByBoardId(
	boardId: string,
	skip = 0,
	take = 5
): Promise<PaginatedList<Article>> {
	try {
		const response = await fetch(`/api/article?boardId=${boardId}&skip=${skip}&take=${take}`);
		if (!response.ok) {
			throw new Error(`Failed to get articles: ${response.statusText}`);
		}
		return await response.json();
	} catch (error) {
		console.error('Error occurred while getting articles:', error);
		return { items: [], totalCount: 0 };
	}
}
