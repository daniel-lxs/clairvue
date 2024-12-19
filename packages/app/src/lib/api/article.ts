import type { PaginatedList, ArticleMetadata, ArticleWithInteraction } from '@clairvue/types';
import { Result } from '@clairvue/types';
import { normalizeError, validateDateString } from '$lib/utils';
import { publicConfig } from '../config.public';

export async function getArticlesByCollectionId(
  collectionId: string,
  beforePublishedAt?: Date | string,
  take = 5
): Promise<Result<PaginatedList<ArticleWithInteraction>, Error>> {
  try {
    const baseUrl = publicConfig.app.baseUrl;
    const url = new URL(`/api/article?collectionId=${collectionId}`, baseUrl);
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
): Promise<Result<PaginatedList<ArticleWithInteraction>, Error>> {
  try {
    const baseUrl = publicConfig.app.baseUrl;
    const url = new URL(`/api/article?feedId=${feedId}`, baseUrl);
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

export async function countArticlesByFeedId(
  feedId: string,
  afterPublishedAt?: Date | string
): Promise<Result<{ count: number }, Error>> {
  let dateParam = afterPublishedAt;
  if (dateParam) {
    if (typeof dateParam === 'string') {
      const isDateValid = validateDateString(dateParam);
      if (!isDateValid) {
        return Result.err(new Error('Invalid date format'));
      }
    } else {
      dateParam = dateParam.toISOString();
    }
  }

  try {
    const baseUrl = publicConfig.app.baseUrl;
    const url = new URL(`/api/article/count`, baseUrl);
    url.searchParams.set('feedId', feedId);
    if (dateParam) {
      url.searchParams.set('afterPublishedAt', dateParam);
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

export async function countArticlesByCollectionId(
  collectionId: string,
  afterPublishedAt?: Date | string
): Promise<Result<{ count: number }, Error>> {
  let dateParam = afterPublishedAt;
  if (dateParam) {
    if (typeof dateParam === 'string') {
      const isDateValid = validateDateString(dateParam);
      if (!isDateValid) {
        return Result.err(new Error('Invalid date format'));
      }
    } else {
      dateParam = dateParam.toISOString();
    }
  }

  try {
    const baseUrl = publicConfig.app.baseUrl;
    const url = new URL(`/api/article/count`, baseUrl);
    url.searchParams.set('collectionId', collectionId);
    if (dateParam) {
      url.searchParams.set('afterPublishedAt', dateParam);
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
  try {
    const baseUrl = publicConfig.app.baseUrl;
    const url = new URL(`/api/article`, baseUrl);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ feedId, ...articleData })
    });

    if (!response.ok) {
      const error = await response.text();
      return Result.err(new Error(error));
    }

    const data = await response.json();
    return Result.ok(data);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while creating article:', error);
    return Result.err(error);
  }
}

export async function getArticleMetadata(
  articleUrl: string
): Promise<Result<ArticleMetadata, Error>> {
  try {
    const baseUrl = publicConfig.app.baseUrl;
    const url = new URL(`/api/article/metadata`, baseUrl);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: articleUrl })
    });

    if (!response.ok) {
      const error = await response.text();
      return Result.err(new Error(error));
    }

    const data = await response.json();
    return Result.ok(data);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting article metadata:', error);
    return Result.err(error);
  }
}

export async function getSavedArticles(
  take: number = 20,
  skip: number = 0
): Promise<Result<ArticleWithInteraction[] | false, Error>> {
  try {
    const baseUrl = publicConfig.app.baseUrl;
    const url = new URL(`/api/article/interactions?saved=true&take=${take}&skip=${skip}`, baseUrl);
    console.log('url', url.toString());
    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.statusText;
      return Result.err(new Error(error));
    }

    const data = await response.json();
    return Result.ok(data);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting saved articles:', error);
    return Result.err(error);
  }
}

export async function updateInteractions(
  articleId: string,
  read?: boolean,
  saved?: boolean
): Promise<Result<true, Error>> {
  try {
    const baseUrl = publicConfig.app.baseUrl;
    const url = new URL(`/api/article/interactions`, baseUrl);
    const response = await fetch(url.toString(), {
      method: 'PUT',
      body: JSON.stringify({ articleId, read, saved })
    });

    if (!response.ok) {
      const error = await response.text();
      return Result.err(new Error(error));
    }

    return Result.ok(true);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while updating interactions:', error);
    return Result.err(error);
  }
}
