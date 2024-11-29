import { Worker, type ConnectionOptions } from 'bullmq';
import type { ArticleMetadata, Feed } from '@clairvue/types';
import articleMetadataService from './services/article-metadata.service';
import readableArticleService from './services/readable-article.service';
import { isValidLink } from './utils';

interface GetArticlesJob {
  feed: Feed;
}

export function startSyncArticlesWorker(connection: ConnectionOptions) {
  const worker = new Worker<GetArticlesJob>(
    'sync-articles',
    async (job) => {
      console.info(`Job ${job.id} started...`);
      const { feed } = job.data;

      if (!feed) {
        console.error('Feed not found');
        return;
      }
      try {
        const rawArticles = await articleMetadataService.retrieveArticlesFromFeed(feed.link);

        if (!rawArticles) return [];

        console.info(`[${job.id}] Syncing ${rawArticles.length} articles from ${feed.name}...`);

        const chunkSize = 10;
        const parallelDelay = 1000;

        if (rawArticles.length === 0) return [];
        const articlesMetadata: ArticleMetadata[] = [];

        const chunks = Array.from({ length: Math.ceil(rawArticles.length / chunkSize) }, (_, i) =>
          rawArticles.slice(i * chunkSize, i * chunkSize + chunkSize)
        );

        for (const chunk of chunks) {
          const chunkResults = await Promise.all(
            chunk.map(async (article) => {
              const link = article.link;

              if (!isValidLink(link)) {
                return undefined;
              }

              const readableArticle = await readableArticleService.retrieveReadableArticle(link);
              const readable = !!readableArticle;

              if (readable) {
                readableArticleService.createReadableArticleCache(link, readableArticle);
              }

              return await articleMetadataService.retrieveArticleMetadata(article, readable);
            })
          );

          articlesMetadata.push(
            ...chunkResults.filter((article): article is ArticleMetadata => Boolean(article))
          );

          await new Promise((resolve) => setTimeout(resolve, parallelDelay));
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
      concurrency: 5,
      connection
    }
  );

  worker.on('ready', () => {
    console.info(`Get articles worker is ready.`);
  });

  worker.on('completed', async (job) => {
    console.info(`Job ${job.id} finished...`);
  });

  worker.on('failed', async (job) => {
    if (job) {
      console.info(`Job ${job.id} failed: ${job.failedReason}`);
    }
    console.info(`A unknown error occurred on worker.`);
  });
}
