import { Worker, type ConnectionOptions } from 'bullmq';
import { parseReadableArticle } from '@/server/services/article';
import { cacheArticle } from '@/server/services/cache';

interface CacheArticleJob {
  slug: string;
  url: string;
}
export function startArticleCacheWorker() {
  const connection: ConnectionOptions = {
    host: process.env.PRIVATE_REDIS_HOST,
    port: Number(process.env.PRIVATE_REDIS_PORT),
    password: process.env.REDIS_PASSWORD
  };

  const worker = new Worker<CacheArticleJob>(
    'article-cache',
    async (job) => {
      const { slug, url } = job.data;
      try {
        const parsedArticle = await parseReadableArticle(url);
        if (parsedArticle) {
          await cacheArticle(slug, parsedArticle);
          console.info(`Cached article ${slug}`);
        }
      } catch (error) {
        console.error(`Failed to cache article ${slug}:`, error);
        throw error;
      }
    },
    { connection }
  );

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed:`, error);
  });
}
