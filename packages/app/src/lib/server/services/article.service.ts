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
import cacheService from './cache.service';
import feedRepository from '../data/repositories/feed.repository';

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
  afterPublishedAt?: string
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

async function processArticlesFromJob(
  feedId: string,
  jobResult: ArticleMetadata[]
): Promise<Result<string[], Error>> {
  const feed = await feedRepository.findById(feedId);

  if (feed.isErr()) {
    return Result.err(feed.unwrapErr());
  }

  // Check if the job result is valid
  const validationResult = createArticlesDto.safeParse(jobResult);
  if (!validationResult.success) {
    return Result.err(new Error('Invalid job result', { cause: validationResult.error }));
  }

  const articles = validationResult.data;
  if (!articles || articles.length === 0) {
    console.warn('No articles found');
    return Result.ok([]);
  }

  // Create articles and cache them in a single transaction
  return await articleRepository.withTransaction(async (tx) => {
    const createdArticles: string[] = [];

    for (const article of articles) {
      // Check if the article already exists in the database
      const articleExistsResult = await articleRepository.existsByLink(article.link);
      if (articleExistsResult.isOkAnd((exists) => exists)) {
        console.info(`Article with link ${article.link} already exists. Skipping.`);

        // Check if the article is already cached in Redis
        const cachedArticle = await cacheService.getArticleMetadataFromCache(article.link);
        if (cachedArticle.isOkAnd((cached) => !!cached)) {
          console.info(`Article with link ${article.link} already cached in Redis.`);
          continue;
        } else {
          //store the article in redis
          const cacheMetadataResult = await cacheService.storeArticleMetadataInCache(
            article.link,
            article
          );
          if (cacheMetadataResult.isErr()) {
            console.error(
              `Error caching article metadata for link ${article.link}: ${cacheMetadataResult.unwrapErr().message}`
            );
            tx.rollback();
            return Result.err(cacheMetadataResult.unwrapErr());
          }
        }

        continue;
      }

      // Create the article in the database
      const newArticle: NewArticle = {
        ...article,
        description: article.description ?? null,
        image: article.image ?? null,
        author: article.author ?? null
      };
      const createResult = await articleRepository.create([newArticle], feedId);

      if (createResult.isErr()) {
        console.error(
          `Error creating article with link ${article.link}: ${createResult.unwrapErr().message}`
        );
        tx.rollback();
        return Result.err(createResult.unwrapErr());
      }

      // Cache the article metadata in Redis
      const cacheMetadataResult = await cacheService.storeArticleMetadataInCache(
        article.link,
        article
      );
      if (cacheMetadataResult.isErr()) {
        console.error(
          `Error caching article metadata for link ${article.link}: ${cacheMetadataResult.unwrapErr().message}`
        );
        tx.rollback();
        return Result.err(cacheMetadataResult.unwrapErr());
      }

      // Cache the readable article in Redis if it's marked as readable
      if (article.readable && article.readableContent) {
        const cacheReadableResult = await cacheService.createReadableArticleCache(
          article.link,
          article.readableContent
        );
        if (cacheReadableResult.isErr()) {
          console.error(
            `Error caching readable article for link ${article.link}: ${cacheReadableResult.unwrapErr().message}`
          );
          tx.rollback();
          return Result.err(cacheReadableResult.unwrapErr());
        }
      }

      createdArticles.push(...createResult.unwrap());
    }

    return Result.ok(createdArticles);
  });
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
  updateInteractions,
  processArticlesFromJob
};
