export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PRIVATE_DB_URL: string;
      PRIVATE_REDIS_HOST: string;
      PRIVATE_REDIS_PORT: number;
      PRIVATE_REDIS_PASSWORD: string;
    }
  }
}
