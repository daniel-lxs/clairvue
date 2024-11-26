import type { Article } from '@/server/data/schema';
import type { PaginatedList } from '@/types/PaginatedList';

export async function getArticlesByCollectionId(
  collectionId: string,
  beforePublishedAt?: Date | string,
  take = 5
): Promise<PaginatedList<Article>> {
  try {
    beforePublishedAt = beforePublishedAt
      ? typeof beforePublishedAt === 'string'
        ? new Date(beforePublishedAt)
        : beforePublishedAt
      : undefined;
    const response = await fetch(
      `/api/article?collectionId=${collectionId}&${beforePublishedAt ? `beforePublishedAt=${beforePublishedAt.toISOString()}` : ''}&take=${take}`
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

export async function getArticlesByFeedId(
  feedId: string,
  beforePublishedAt?: Date | string,
  take = 5
): Promise<PaginatedList<Article>> {
  try {
    beforePublishedAt = beforePublishedAt
      ? typeof beforePublishedAt === 'string'
        ? new Date(beforePublishedAt)
        : beforePublishedAt
      : undefined;
    const response = await fetch(
      `/api/article?feedId=${feedId}&${beforePublishedAt ? `beforePublishedAt=${beforePublishedAt.toISOString()}` : ''}&take=${take}`
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
  collectionId?: string
): Promise<number | undefined> {
  try {
    let afterPublishedAt: string = '';

    if (typeof afterDate !== 'string') {
      afterPublishedAt = afterDate.toISOString();
    } else {
      afterPublishedAt = afterDate;
    }

    const response = await fetch(
      `/api/article/count?afterPublishedAt=${afterPublishedAt}${feedId ? `&feedId=${feedId}` : ''}${collectionId ? `&collectionId=${collectionId}` : ''}`
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
