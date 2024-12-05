import type { PaginatedList, Article } from '@clairvue/types';
import { z } from 'zod';
import { Result } from '@clairvue/types';
import { normalizeError } from '@/utils';

export async function getArticlesByCollectionId(
  collectionId: string,
  beforePublishedAt?: Date | string,
  take = 5
): Promise<Result<PaginatedList<Article>, Error>> {
  let validatedDate: Date | undefined;

  if (beforePublishedAt && typeof beforePublishedAt === 'string') {
    validatedDate = z.date().safeParse(beforePublishedAt).success
      ? z.date().safeParse(beforePublishedAt).data
      : undefined;
  }

  try {
    const url = new URL(`/api/article?collectionId=${collectionId}`, location.origin);
    url.searchParams.set('take', take.toString());

    if (validatedDate) {
      url.searchParams.set('beforePublishedAt', validatedDate.toISOString());
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

export async function getArticlesByFeedId(
  feedId: string,
  beforePublishedAt?: Date | string,
  take = 5
): Promise<Result<PaginatedList<Article>, Error>> {
  let validatedDate: Date | undefined;

  if (beforePublishedAt && typeof beforePublishedAt === 'string') {
    validatedDate = z.date().safeParse(beforePublishedAt).success
      ? z.date().safeParse(beforePublishedAt).data
      : undefined;
  }

  try {
    const url = new URL(`/api/article?feedId=${feedId}`, location.origin);
    url.searchParams.set('take', take.toString());

    if (validatedDate) {
      url.searchParams.set('beforePublishedAt', validatedDate.toISOString());
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

export async function countArticles(
  afterPublishedAt: Date | string,
  feedId?: string,
  collectionId?: string
): Promise<Result<number, Error>> {
  let validatedDate: Date | undefined;

  if (afterPublishedAt && typeof afterPublishedAt === 'string') {
    validatedDate = z.date().safeParse(afterPublishedAt).success
      ? z.date().safeParse(afterPublishedAt).data
      : undefined;
  }

  try {
    const url = new URL(`/api/article/count`, location.origin);

    if (validatedDate) {
      url.searchParams.set('afterPublishedAt', validatedDate.toISOString());
    }

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
