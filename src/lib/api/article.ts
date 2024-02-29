import type { Article } from '@/server/data/schema';
import type { PaginatedList } from '@/types/PaginatedList';

export async function getArticlesByBoardId(
	boardId: string,
	page: number = 1
): Promise<PaginatedList<Article> | undefined> {
	try {
		const response = await fetch(`/api/article?boardId=${boardId}&page=${page}`);
		if (!response.ok) {
			throw new Error(`Failed to get articles: ${response.statusText}`);
		}
		return await response.json();
	} catch (error) {
		console.error('Error occurred while getting articles:', error);
		return undefined;
	}
}
