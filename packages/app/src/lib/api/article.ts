import type { PaginatedList, Article } from '@clairvue/types';
import { Result } from '@clairvue/types';
import { normalizeError, validateDateString } from '@/utils';

export async function getArticlesByCollectionId(
  collectionId: string,
  beforePublishedAt?: Date | string,
  take = 5
): Promise<Result<PaginatedList<Article>, Error>> {
  try {
    const url = new URL(`/api/article?collectionId=${collectionId}`, location.origin);
    url.searchParams.set('take', take.toString());

    if (beforePublishedAt) {
      if (typeof beforePublishedAt === 'string') {
        const isDateValid = validateDateString(beforePublishedAt);

        if (!isDateValid) {
          return Result.err(new Error('Invalid date format'));
        }
        url.searchParams.set('beforePublishedAt', beforePublishedAt);
      } else {
        url.searchParams.set('beforePublishedAt', beforePublishedAt.toISOString());
      }
    }
    const response = await fetch(url.toString());

    if (response.status === 404) {
      return Result.ok({
        items: [],
        totalCount: 0
      });
    }

    if (!response.ok) {
      return Result.err(new Error(`Failed to get articles: ${response.statusText}`));
    }

    return Result.ok(await response.json());
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting articles:', error);
    return Result.err(error);
  }
}

export async function getArticlesByFeedId(
  feedId: string,
  beforePublishedAt?: Date | string,
  take = 5
): Promise<Result<PaginatedList<Article>, Error>> {
  try {
    const url = new URL(`/api/article?feedId=${feedId}`, location.origin);
    url.searchParams.set('take', take.toString());

    if (beforePublishedAt) {
      if (typeof beforePublishedAt === 'string') {
        const isDateValid = validateDateString(beforePublishedAt);

        if (!isDateValid) {
          return Result.err(new Error('Invalid date format'));
        }
        url.searchParams.set('beforePublishedAt', beforePublishedAt);
      } else {
        url.searchParams.set('beforePublishedAt', beforePublishedAt.toISOString());
      }
    }

    const response = await fetch(url.toString());

    if (response.status === 404) {
      return Result.ok({
        items: [],
        totalCount: 0
      });
    }

    if (!response.ok) {
      return Result.err(new Error(`Failed to get articles: ${response.statusText}`));
    }

    return Result.ok(await response.json());
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting articles:', error);
    return Result.err(error);
  }
}

export async function countArticles(
  afterPublishedAt: Date | string,
  feedId?: string,
  collectionId?: string
): Promise<Result<{ count: number }, Error>> {
  if (typeof afterPublishedAt === 'string') {
    const isDateValid = validateDateString(afterPublishedAt);

    if (!isDateValid) {
      return Result.err(new Error('Invalid date format'));
    }
  } else {
    afterPublishedAt = afterPublishedAt.toISOString();
  }

  try {
    const url = new URL(`/api/article/count`, location.origin);

    url.searchParams.set('afterPublishedAt', afterPublishedAt);

    if (feedId) {
      url.searchParams.set('feedId', feedId);
    }

    if (collectionId) {
      url.searchParams.set('collectionId', collectionId);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      return Result.err(new Error(`Failed to get articles: ${response.statusText}`));
    }
    return Result.ok(await response.json());
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting articles:', error);
    return Result.err(error);
  }
}

export async function createArticle(
  feedId: string,
  articleData: { title: string; url: string; makeReadable: boolean }
): Promise<Result<string[], Error>> {
  const response = await fetch('/api/article', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ feedId, ...articleData })
  });

  if (!response.ok) {
    const error = await response.json();
    return Result.err(error);
  }

  const data = await response.json();
  return Result.ok(data);
}
