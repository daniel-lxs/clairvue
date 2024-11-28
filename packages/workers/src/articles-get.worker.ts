import { Worker, type ConnectionOptions } from 'bullmq';
import articlesService from './services/article.service';
import type { Feed } from '@clairvue/types';

interface GetArticlesJob {
  feed: Feed;
}

export function startArticleMetadataWorker(connection: ConnectionOptions) {
  const worker = new Worker<GetArticlesJob>(
    'get-articles',
    async (job) => {
      console.info(`Job ${job.id} started...`);
      const { feed } = job.data;
      if (!feed) {
        console.error('Feed not found');
        return;
      }
      const articlesMetadata = await articlesService.getArticlesMetadata(feed, job.id);

      return articlesMetadata;
    },
    {
      concurrency: 5,
      connection
    }
  );

  worker.on('ready', () => {
    console.info(`Article metadata worker is ready.`);
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
