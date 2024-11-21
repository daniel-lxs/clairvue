export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PRIVATE_DB_URL: string;
      PRIVATE_DB_HOST: string;
      PRIVATE_DB_PORT: string;
      PRIVATE_DB_USER: string;
      PRIVATE_DB_PASSWORD: string;
      PRIVATE_DB_NAME: string;
      PRIVATE_REDIS_HOST: string;
      PRIVATE_REDIS_PORT: string;
      PRIVATE_REDIS_PASSWORD: string;
      PUBLIC_USER_AGENT: string;
    }
  }
}
