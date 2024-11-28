import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export interface Config {
  redis: {
    host: string;
    port: number;
    password: string;
  };
  app: {
    userAgent: string;
  };
}

export default {
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT) ?? 6379,
    password: process.env.REDIS_PASSWORD ?? ''
  },
  app: {
    userAgent: process.env.USER_AGENT ?? ''
  }
} satisfies Config;
