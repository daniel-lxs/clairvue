import { Feed, ArticleMetadata, ReadableArticle } from '@clairvue/types';
import { Job } from 'bullmq';
import articleMetadataService from '../services/article-metadata.service';
import httpService from '../services/http.service';
import readableArticleService from '../services/readable-article.service';
import { isValidLink, isHtmlMimeType } from '../utils';

export interface GetArticlesJob {
  feed: Feed;
}

export interface JobConfig {
  chunkSize: number;
  parallelDelay: number;
}

const DEFAULT_CONFIG: JobConfig = {
  chunkSize: 10,
  parallelDelay: 1000
};

export async function syncArticlesProcessor(job: Job<GetArticlesJob>): Promise<ArticleMetadata[]> {
  console.info(`Job ${job.id} started...`);
  const { feed } = job.data;

  if (!feed) {
    throw new Error('Feed not found');
  }

  const rawArticlesResult = await articleMetadataService.retrieveArticlesFromFeed(feed.link);

  if (rawArticlesResult.isErr()) {
    console.error(
      `[${job.id}] Error retrieving articles from feed ${feed.name}: ${rawArticlesResult.unwrapErr().message}`
    );
    return [];
  }

  if (rawArticlesResult.isOkAnd((articles) => !articles || articles.length === 0)) {
    console.info(`[${job.id}] No articles found in feed ${feed.name}.`);
    return [];
  }

  const rawArticles = rawArticlesResult.unwrap();

  console.info(`[${job.id}] Syncing ${rawArticles.length} articles from ${feed.name}...`);

  const articlesMetadata: ArticleMetadata[] = [];

  const chunks = Array.from(
    { length: Math.ceil(rawArticles.length / DEFAULT_CONFIG.chunkSize) },
    (_, i) =>
      rawArticles.slice(
        i * DEFAULT_CONFIG.chunkSize,
        i * DEFAULT_CONFIG.chunkSize + DEFAULT_CONFIG.chunkSize
      )
  );

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (article) => {
        const { title, link } = article;

        if (!isValidLink(link)) {
          console.warn(`[${job.id}] Invalid link found: ${link}`);
          return undefined;
        }

        const existingArticleMetadataResult =
          await articleMetadataService.retrieveCachedArticleMetadata(link);

        if (existingArticleMetadataResult.isOkAnd((article) => !!article)) {
          return undefined;
        }

        const articleResult = await httpService.fetchArticle(link);

        if (articleResult.isErr()) {
          console.warn(`[${job.id}] Error fetching article: ${link}`);
          return {
            title: title ?? 'Untitled',
            link,
            readable: false,
            publishedAt: new Date(),
            siteName: new URL(link).hostname.replace('www.', '')
          };
        }

        const { response, mimeType } = articleResult.unwrap();

        if (!response || !isHtmlMimeType(mimeType)) {
          console.warn(`[${job.id}] Article not HTML: ${link}`);
          return {
            title: title ?? 'Untitled',
            link,
            readable: false,
            publishedAt: new Date(),
            siteName: new URL(link).hostname.replace('www.', '')
          };
        }

        const readableArticleResult = await readableArticleService.retrieveReadableArticle(
          link,
          response.clone()
        );

        let readable = false;

        if (readableArticleResult.isOkAnd((readableArticle) => !!readableArticle)) {
          await readableArticleService.createReadableArticleCache(
            link,
            readableArticleResult.unwrap() as ReadableArticle
          );
          readable = true;
        } else {
          console.warn(`[${job.id}] Readable article not found: ${link}`);
        }

        const metadataResult = await articleMetadataService.retrieveArticleMetadata(
          response.clone(),
          article,
          readable
        );

        return metadataResult.match({
          ok: (metadata) => metadata,
          err: (error) => {
            console.error(`[${job.id}] Error processing article: ${error.message}`);
            return undefined;
          }
        });
      })
    );

    articlesMetadata.push(
      ...chunkResults.filter((article): article is ArticleMetadata => Boolean(article))
    );

    await new Promise((resolve) => setTimeout(resolve, DEFAULT_CONFIG.parallelDelay));
  }

  if (!articlesMetadata || articlesMetadata.length === 0) {
    console.info(`[${job.id}] No new articles found.`);
    return [];
  }

  console.info(`[${job.id}] ${articlesMetadata.length} new articles found.`);
  return articlesMetadata;
}
