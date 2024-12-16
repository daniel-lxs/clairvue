import articleRepository from '@/server/data/repositories/article.repository';
import type {
  Article,
  ArticleMetadata,
  ArticleWithInteraction,
  NewArticle,
  PaginatedList
} from '@clairvue/types';
import { createArticlesDto } from '../dto/article.dto';
import { Result } from '@clairvue/types';
import feedService from './feed.service';

async function create(newArticles: NewArticle[], feedId: string): Promise<Result<string[], Error>> {
  return await articleRepository.create(newArticles, feedId);
}

async function createFromJobResult(
  feedId: string,
  jobResult: ArticleMetadata[]
): Promise<Result<string[], Error>> {
  feedService.updateLastSyncedAt(feedId);
  const validationResult = createArticlesDto.safeParse(jobResult);

  if (!validationResult.success) {
    console.error('Error occurred while creating article:', validationResult.error);
    return Result.err(
      new Error('Error occurred while creating article', { cause: validationResult.error })
    );
  }

  const articles = validationResult.data;
  if (!articles || articles.length === 0) {
    console.warn('No articles found');
    return Result.ok([]);
  }

  return await create(
    articles.map((article) => ({
      ...article,
      description: article.description ?? null,
      image: article.image ?? null,
      author: article.author ?? null
    })),
    feedId
  );
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

async function findByCollectionId(
  collectionId: string,
  beforePublishedAt?: string,
  take: number = 5
): Promise<Result<PaginatedList<Article> | false, Error>> {
  return await articleRepository.findByCollectionId(collectionId, beforePublishedAt, take);
}

async function findByCollectionIdWithInteractions(
  collectionId: string,
  userId: string,
  beforePublishedAt?: string,
  take: number = 5
): Promise<Result<PaginatedList<ArticleWithInteraction> | false, Error>> {
  return await articleRepository.findByCollectionIdWithInteractions(
    collectionId,
    userId,
    beforePublishedAt,
    take
  );
}

async function findByFeedIdWithInteractions(
  feedId: string,
  userId: string,
  beforePublishedAt?: string,
  take: number = 5
): Promise<Result<PaginatedList<ArticleWithInteraction> | false, Error>> {
  return await articleRepository.findByFeedIdWithInteractions(
    feedId,
    userId,
    beforePublishedAt,
    take
  );
}

async function countArticlesByFeedId(
  feedId: string,
  afterPublishedAt: string = new Date().toISOString()
): Promise<Result<number, Error>> {
  return await articleRepository.countArticlesByFeedId(feedId, afterPublishedAt);
}

async function countArticlesByCollectionId(
  collectionId: string,
  afterPublishedAt: string = new Date().toISOString()
): Promise<Result<number, Error>> {
  return await articleRepository.countArticlesByCollectionId(collectionId, afterPublishedAt);
}

async function existsWithLink(link: string): Promise<Result<boolean, Error>> {
  return await articleRepository.existsByLink(link);
}

async function findSavedByUserId(
  userId: string,
  take: number = 20,
  skip: number = 0
): Promise<Result<ArticleWithInteraction[] | false, Error>> {
  return await articleRepository.findSavedByUserId(userId, take, skip);
}

async function findUnreadByUserId(
  userId: string,
  take: number = 20,
  skip: number = 0
): Promise<Result<ArticleWithInteraction[] | false, Error>> {
  return await articleRepository.findUnreadByUserId(userId, take, skip);
}

async function updateInteractions(
  userId: string,
  articleId: string,
  read?: boolean,
  saved?: boolean
): Promise<Result<true, Error>> {
  return await articleRepository.updateInteractions(userId, articleId, read, saved);
}

export default {
  findBySlug,
  countArticlesByFeedId,
  countArticlesByCollectionId,
  create,
  createFromJobResult,
  findByFeedId,
  findByFeedIdWithInteractions,
  existsWithLink,
  findByCollectionId,
  findByCollectionIdWithInteractions,
  findSavedByUserId,
  findUnreadByUserId,
  updateInteractions
};
