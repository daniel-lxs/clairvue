import type { Article } from '@/server/data/schema';
import type { PaginatedList } from '@/types/PaginatedList';

export async function getArticlesByBoardId(
  boardId: string,
  afterPublishedAt?: Date | string,
  take = 5
): Promise<PaginatedList<Article>> {
  try {
    afterPublishedAt = afterPublishedAt
      ? typeof afterPublishedAt === 'string'
        ? new Date(afterPublishedAt)
        : afterPublishedAt
      : undefined;
    const response = await fetch(
      `/api/article?boardId=${boardId}&${afterPublishedAt ? `afterPublishedAt=${afterPublishedAt.toISOString()}` : ''}&take=${take}`
    );
    if (!response.ok) {
      throw new Error(`Failed to get articles: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error occurred while getting articles:', error);
    return { items: [], totalCount: 0 };
  }
}

export async function countArticles(
  afterDate: Date | string,
  feedId?: string,
  boardId?: string
): Promise<number | undefined> {
  try {
    let afterPublishedAt: string = '';

    if (typeof afterDate !== 'string') {
      afterPublishedAt = afterDate.toISOString();
    } else {
      afterPublishedAt = afterDate;
    }


    const response = await fetch(
      `/api/article/count?afterPublishedAt=${afterPublishedAt}${feedId ? `&feedId=${feedId}` : ''}${boardId ? `&boardId=${boardId}` : ''}`
    );
    if (!response.ok) {
      throw new Error(`Failed to get articles: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error occurred while getting articles:', error);
    return undefined;
  }
}
