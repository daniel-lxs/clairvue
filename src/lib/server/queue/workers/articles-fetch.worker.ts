import { Worker, type ConnectionOptions } from 'bullmq';
import feedRepository from '@/server/data/repositories/feed';
import { syncArticles } from '@/server/services/article';

export async function startArticlesWorker() {
  const connection: ConnectionOptions = {
    host: process.env.PRIVATE_REDIS_HOST,
    port: process.env.PRIVATE_REDIS_PORT,
    password: process.env.REDIS_PASSWORD
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
        const createdArticlesIds = await syncArticles(feed);
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
