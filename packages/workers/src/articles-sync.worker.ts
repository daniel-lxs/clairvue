import { Worker, type ConnectionOptions } from 'bullmq';
import type { ArticleMetadata, Feed } from '@clairvue/types';
import articleMetadataService from './services/article-metadata.service';
import readableArticleService from './services/readable-article.service';
import { isValidLink } from './utils';

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

export function startSyncArticlesWorker(connection: ConnectionOptions, config?: WorkerConfig) {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  const worker = new Worker<GetArticlesJob>(
    'sync-articles',
    async (job) => {
      console.info(`Job ${job.id} started...`);
      const { feed } = job.data;

      if (!feed) {
        throw new Error('Feed not found');
      }

      try {
        const rawArticles = await articleMetadataService.retrieveArticlesFromFeed(feed.link);

        if (!rawArticles) return [];

        console.info(`[${job.id}] Syncing ${rawArticles.length} articles from ${feed.name}...`);

        if (rawArticles.length === 0) return [];
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
              try {
                const link = article.link;

                if (!isValidLink(link)) {
                  console.warn(`[${job.id}] Invalid link found: ${link}`);
                  return undefined;
                }

                const readableArticle = await readableArticleService.retrieveReadableArticle(link);
                const readable = !!readableArticle;

                if (readable) {
                  await readableArticleService.createReadableArticleCache(link, readableArticle);
                } else {
                  console.warn(`[${job.id}] Article not readable: ${link}`);
                }

                return await articleMetadataService.retrieveArticleMetadata(article, readable);
              } catch (error) {
                console.error(
                  `[${job.id}] Error processing article: ${error instanceof Error ? error.message : error}`
                );
                return undefined;
              }
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
      } catch (error) {
        if (error instanceof Error) {
          console.error(`[${job.id}] Error occurred while fetching feed articles:`, error.message);
        } else {
          console.error(`[${job.id}] Unknown error occurred while fetching feed articles ${error}`);
        }
        return [];
      }
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
