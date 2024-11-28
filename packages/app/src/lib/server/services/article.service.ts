import articleRepository from '@/server/data/repositories/article.repository';
import type { Article } from '@/server/data/schema';
import type { NewArticle, PaginatedList } from '@clairvue/types';
import { createArticlesDto } from '../dto/article.dto';
import feedService from './feed.service';

async function create(newArticles: NewArticle[]): Promise<string[] | undefined> {
  const createdIds = await articleRepository.create(newArticles);
  return createdIds;
}

async function createFromJobResult(feedId: string, jobResult: any): Promise<string[] | undefined> {
  const feed = await feedService.findFeedById(feedId);
  if (!feed) {
    throw new Error('Feed not found');
  }
  const validationResult = createArticlesDto.safeParse(jobResult);
  if (!validationResult.success) {
    throw new Error('Failed to create articles: ' + validationResult.error.message);
  }
  const articles = validationResult.data;
  if (!articles || articles.length === 0) {
    console.info('No new articles found');
    return [];
  }
  console.info(`${articles.length} new articles found`);
  for (const article of articles) {
    (article as NewArticle).feedId = feed.id;
  }
  feedService.updateLastSyncedAt(feed.id);
  return await create(articles as NewArticle[]);
}

async function findByCollectionId(
  collectionId: string,
  beforePublishedAt?: string,
  take: number = 5
): Promise<PaginatedList<Article> | undefined> {
  return await articleRepository.findByCollectionId(collectionId, beforePublishedAt, take);
}

async function findByFeedId(
  feedId: string,
  beforePublishedAt?: string,
  take: number = 5
): Promise<PaginatedList<Article> | undefined> {
  return await articleRepository.findByFeedId(feedId, beforePublishedAt, take);
}

async function findBySlug(slug: string): Promise<Article | undefined> {
  return await articleRepository.findBySlug(slug);
}

async function countArticles(
  afterPublishedAt: Date,
  feedId?: string,
  collectionId?: string
): Promise<number | undefined> {
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
