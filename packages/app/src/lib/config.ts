import {
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_HOST,
  DB_HOST,
  DB_URL,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  ORIGIN,
  ARTICLE_CACHE_TTL,
  USER_AGENT
} from '$env/static/private';

type Config = {
  redis: {
    host: string;
    port: number;
    password: string;
  };
  db: {
    url: string;
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    ssl: boolean;
  };
  app: {
    env: string;
    origin: string;
    articleCacheTTL: number;
    userAgent: string;
  };
};

export default {
  redis: {
    host: REDIS_HOST || 'localhost',
    port: Number(REDIS_PORT) || 6379,
    password: REDIS_PASSWORD
  },
  db: {
    url: DB_URL || 'postgres://postgres:postgres@localhost:5432/clairvue',
    host: DB_HOST || 'localhost',
    port: Number(DB_PORT) || 5432,
    user: DB_USER || 'postgres',
    password: DB_PASSWORD || 'postgres',
    name: DB_NAME || 'clairvue',
    ssl: false
  },
  app: {
    env: process.env.NODE_ENV || 'development',
    origin: ORIGIN || 'http://localhost:3000',
    articleCacheTTL: Number(ARTICLE_CACHE_TTL) || 60,
    userAgent:
      USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36'
  }
} satisfies Config;
