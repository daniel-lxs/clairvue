import { Queue, type ConnectionOptions } from 'bullmq';
import config from '@/config';

export const getArticleQueue = () => {
  const connection: ConnectionOptions = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password
  };

  return new Queue('articles', { connection });
};

export const getArticleCacheQueue = () => {
  const connection: ConnectionOptions = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password
  };

  return new Queue('article-cache', { connection });
};
