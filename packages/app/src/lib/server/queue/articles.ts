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
  return new Queue('get-articles', { connection });
};

export const listenArticlesQueue = () => {
  const articleQueue = getArticlesQueue();
  const queueEvents = new QueueEvents('get-articles', { connection });

  queueEvents.on('completed', async ({ jobId }) => {
    console.info(`Job ${jobId} completed...`);
    const job = await Job.fromId(articleQueue, jobId);

    if (!job) {
      console.error(`Job ${jobId} not found`);
      return;
    }

    await articleService.createFromJobResult(job.data.feed.id, job.returnvalue);
    // Clean up
    await articleQueue.remove(jobId);
  });
};

export const getUpdatedArticleQueue = () => {
  return new Queue('get-updated-article', { connection });
};
