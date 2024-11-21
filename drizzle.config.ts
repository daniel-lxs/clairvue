import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: 'src/lib/server/data/schema/*',
  out: './drizzle',
  dbCredentials: {
    host: process.env.PRIVATE_DB_HOST || 'localhost',
    port: Number(process.env.PRIVATE_DB_PORT) || 5432,
    user: process.env.PRIVATE_DB_USER || 'postgres',
    password: process.env.PRIVATE_DB_PASSWORD || '',
    database: process.env.PRIVATE_DB_NAME || 'clairvue',
    ssl: false
  }
});
