import { Worker, type ConnectionOptions } from 'bullmq';
import readableArticleService from './services/readable-article.service';

interface GetUpdatedArticleJob {
  slug: string;
  url: string;
}
export function startArticleUpdatedWorker(connection: ConnectionOptions) {
  const worker = new Worker<GetUpdatedArticleJob>(
    'get-updated-article',
    async (job) => {
      const { slug, url } = job.data;
      try {
        const updatedArticle = await readableArticleService.getUpdatedReadableArticle(url);

        return updatedArticle;
      } catch (error) {
        console.error(`Failed to cache article ${slug}:`, error);
        throw error;
      }
    },
    { connection }
  );

  worker.on('ready', () => {
    console.info(`Get updated article worker is ready.`);
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
