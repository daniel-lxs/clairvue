import { Worker, type ConnectionOptions } from 'bullmq';
import articleService from './services/article.service';

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
        const updatedArticle = await articleService.getUpdatedReadableArticle(url);

        return {
          isUpdated: !!updatedArticle,
          article: updatedArticle
        };
      } catch (error) {
        console.error(`Failed to cache article ${slug}:`, error);
        throw error;
      }
    },
    { connection }
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
