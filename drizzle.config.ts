import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: 'src/lib/server/data/schema/*',
  out: './drizzle',
  dbCredentials: {
    host: process.env.PRIVATE_DB_HOST,
    user: process.env.PRIVATE_DB_USER,
    password: process.env.PRIVATE_DB_PASS,
    database: process.env.PRIVATE_DB_NAME,
    ssl: false
  }
});
