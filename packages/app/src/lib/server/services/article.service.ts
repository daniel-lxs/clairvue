import articleRepository from '@/server/data/repositories/article.repository';
import type { Article, ArticleWithFeed, NewArticle, PaginatedList } from '@clairvue/types';
import { createArticlesDto } from '../dto/article.dto';
import { Result } from '@clairvue/types';
import feedService from './feed.service';
import { normalizeError } from '@/utils';

async function create(newArticles: NewArticle[]): Promise<Result<string[], Error>> {
  return await articleRepository.create(newArticles);
}

async function createFromJobResult(
  feedId: string,
  jobResult: any
): Promise<Result<string[], Error>> {
  const result = await feedService.findById(feedId);

  if (result.isOk()) {
    const feed = result.unwrap();

    if (!feed) {
      console.error('Feed not found');
      return Result.err(new Error('Feed not found'));
    }

    feedService.updateLastSyncedAt(feed.id);
    const validationResult = createArticlesDto.safeParse(jobResult);

    if (!validationResult.success) {
      console.error('Error occurred while creating article:', validationResult.error);
      return Result.err(
        new Error('Error occurred while creating article', { cause: validationResult.error })
      );
    }

    const articles = validationResult.data;
    if (!articles || articles.length === 0) {
      console.error('No articles found');
      return Result.err(new Error('No articles found'));
    }

    console.info(`${articles.length} new articles found`);
    for (const article of articles) {
      (article as NewArticle).feedId = feed.id;
    }

    return await create(articles as NewArticle[]);
  } else {
    const error = normalizeError(result.unwrapErr());
    console.error('Error occurred while creating article:', error);
    return Result.err(error);
  }
}

async function findByCollectionId(
  collectionId: string,
  beforePublishedAt?: string,
  take: number = 5
): Promise<Result<PaginatedList<ArticleWithFeed> | false, Error>> {
  return await articleRepository.findByCollectionId(collectionId, beforePublishedAt, take);
}

async function findByFeedId(
  feedId: string,
  beforePublishedAt?: string,
  take: number = 5
): Promise<Result<PaginatedList<Article> | false, Error>> {
  return await articleRepository.findByFeedId(feedId, beforePublishedAt, take);
}

async function findBySlug(slug: string): Promise<Result<Article | false, Error>> {
  return await articleRepository.findBySlug(slug);
}

async function countArticles(
  afterPublishedAt: Date,
  feedId?: string,
  collectionId?: string
): Promise<Result<number, Error>> {
  return await articleRepository.countArticles(afterPublishedAt, feedId, collectionId);
}

export default {
  findBySlug,
  countArticles,
  create,
  createFromJobResult,
  findByFeedId,
  findByCollectionId
};
