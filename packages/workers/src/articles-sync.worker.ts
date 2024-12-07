import { Worker, type ConnectionOptions } from 'bullmq';
import type { ArticleMetadata, Feed } from '@clairvue/types';
import articleMetadataService from './services/article-metadata.service';
import readableArticleService from './services/readable-article.service';
import { isHtmlMimeType, isValidLink } from './utils';
import httpService from './services/http.service';

interface GetArticlesJob {
  feed: Feed;
}
interface WorkerConfig {
  chunkSize?: number;
  parallelDelay?: number;
  concurrency?: number;
  rateLimit?: {
    max: number;
    duration: number;
  };
}

const DEFAULT_CONFIG: Required<WorkerConfig> = {
  chunkSize: 10,
  parallelDelay: 1000,
  concurrency: 5,
  rateLimit: {
    max: 100,
    duration: 60000
  }
};

export function startSyncArticlesWorker(
  connection: ConnectionOptions,
  workerConfig?: WorkerConfig
) {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...workerConfig
  };
  const worker = new Worker<GetArticlesJob>(
    'sync-articles',
    async (job) => {
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
        { length: Math.ceil(rawArticles.length / finalConfig.chunkSize) },
        (_, i) =>
          rawArticles.slice(
            i * finalConfig.chunkSize,
            i * finalConfig.chunkSize + finalConfig.chunkSize
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

            readableArticleResult.match({
              ok: async (readableArticle) => {
                if (readableArticle) {
                  await readableArticleService.createReadableArticleCache(link, readableArticle);
                  readable = true;
                } else {
                  console.warn(`[${job.id}] Readable article not found: ${link}`);
                }
              },
              err: (error) => {
                console.error(`[${job.id}] Error processing article: ${error.message}`);
              }
            });

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

        await new Promise((resolve) => setTimeout(resolve, finalConfig.parallelDelay));
      }

      if (!articlesMetadata || articlesMetadata.length === 0) {
        console.info(`[${job.id}] No new articles found.`);
        return [];
      }

      console.info(`[${job.id}] ${articlesMetadata.length} new articles found.`);
      return articlesMetadata;
    },
    {
      concurrency: finalConfig.concurrency,
      connection,
      limiter: finalConfig.rateLimit
    }
  );

  worker.on('ready', () => {
    console.info(`Get articles worker is ready.`);
  });

  worker.on('completed', async (job, result: ArticleMetadata[]) => {
    const processingTime = Date.now() - job.timestamp;
    console.info(
      `Job ${job.id} finished in ${processingTime}ms. ` +
        `Processed ${result.length} articles successfully.`
    );
  });

  worker.on('failed', async (job, error) => {
    const processingTime = job ? Date.now() - job.timestamp : 0;
    if (job) {
      console.error(
        `Job ${job.id} failed after ${processingTime}ms: ${error.message}`,
        '\nStack:',
        error.stack
      );
    } else {
      console.error(`A worker error occurred: ${error.message}`);
    }
  });

  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`Job ${jobId} has stalled`);
  });
}
