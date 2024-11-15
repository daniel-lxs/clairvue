import { Queue, type ConnectionOptions } from 'bullmq';

export const getArticleQueue = () => {
  const connection: ConnectionOptions = {
    host: process.env.PRIVATE_REDIS_HOST,
    port: process.env.PRIVATE_REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  };

  return new Queue('articles', { connection });
};
