import { Job, Queue, QueueEvents, type ConnectionOptions } from 'bullmq';
import config from '@/config';
import articleService from '../services/article.service';

const connection: ConnectionOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password
};

export function getQueueEvents(name: string) {
  return new QueueEvents(name, { connection });
}

export const getArticlesQueue = () => {
  return new Queue('sync-articles', { connection });
};

export const listenArticlesQueue = () => {
  const articleQueue = getArticlesQueue();
  const queueEvents = new QueueEvents('sync-articles', { connection });

  queueEvents.on('completed', async ({ jobId }) => {
    console.info(`Job ${jobId} completed...`);
    const job = await Job.fromId(articleQueue, jobId);

    if (!job) {
      console.error(`Job ${jobId} not found`);
      return;
    }

    if (
      job.returnvalue === undefined ||
      (Array.isArray(job.returnvalue) && job.returnvalue.length === 0)
    ) {
      console.info('No articles to create');
      return;
    }

    const result = await articleService.processArticlesFromJob(job);

    if (result.isErr()) {
      console.error(`Error processing job ${jobId}`);
    }
  });
};

export const getUpdatedArticleQueue = () => {
  return new Queue('get-updated-article', { connection });
};

export const getArticleMetadataQueue = () => {
  return new Queue('article-metadata', { connection });
};
