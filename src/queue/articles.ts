import { Queue, type ConnectionOptions } from 'bullmq';

const connection: ConnectionOptions = {
  host: process.env.PRIVATE_REDIS_HOST,
  port: process.env.PRIVATE_REDIS_PORT,
  password: process.env.REDIS_PASSWORD
};

const articleQueue = new Queue('articles', { connection });

export const getArticleQueue = () => {
  return articleQueue;
};
