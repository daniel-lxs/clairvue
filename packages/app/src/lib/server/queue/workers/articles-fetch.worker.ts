import { Worker, type ConnectionOptions } from 'bullmq';
import feedRepository from '@/server/data/repositories/feed.repository';
import articlesService from '@/server/services/article.service';
import config from '@/config';

export async function startArticlesWorker() {
  const connection: ConnectionOptions = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password
  };

  const worker = new Worker(
    'articles',
    async (job) => {
      if (job.name === 'sync') {
        console.info(`Job ${job.id} started...`);
        const { feedId } = job.data;
        const feed = await feedRepository.findById(feedId);
        if (!feed) {
          console.error('Feed not found');
          return;
        }
        const createdArticlesIds = await articlesService.syncArticles(feed, job.id);
        return createdArticlesIds;
      }
    },
    {
      concurrency: 5,
      connection
    }
  );

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
