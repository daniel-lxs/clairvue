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
    console.error('No articles found');
    return Result.err(new Error('No articles found'));
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

async function addToSavedArticles(articleId: string, userId: string): Promise<Result<true, Error>> {
  return await articleRepository.addToSavedArticles(articleId, userId);
}

async function removeFromSavedArticles(
  articleId: string,
  userId: string
): Promise<Result<true, Error>> {
  return await articleRepository.removeFromSavedArticles(articleId, userId);
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
  afterPublishedAt?: Date
): Promise<Result<number, Error>> {
  return await articleRepository.countArticlesByFeedId(feedId, afterPublishedAt);
}

async function countArticlesByCollectionId(
  collectionId: string,
  afterPublishedAt?: Date
): Promise<Result<number, Error>> {
  return await articleRepository.countArticlesByCollectionId(collectionId, afterPublishedAt);
}

async function existsWithLink(link: string): Promise<Result<boolean, Error>> {
  return await articleRepository.existsByLink(link);
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
  addToSavedArticles,
  removeFromSavedArticles
};
