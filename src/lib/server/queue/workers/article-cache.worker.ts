import { Worker, type ConnectionOptions } from 'bullmq';
import articleService from '@/server/services/article.service';
import { cacheArticle } from '@/server/services/cache.service';
import config from '@/config';

interface CacheArticleJob {
  slug: string;
  url: string;
}
export function startArticleCacheWorker() {
  const connection: ConnectionOptions = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password
  };

  const worker = new Worker<CacheArticleJob>(
    'article-cache',
    async (job) => {
      const { slug, url } = job.data;
      try {
        const parsedArticle = await articleService.parseReadableArticle(url);
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
