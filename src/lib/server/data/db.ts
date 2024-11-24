import postgres from 'postgres';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import config from '@/config';

const queryClient = postgres(config.db.url, {
  keep_alive: 30000
});

export function getClient() {
  if (!queryClient) {
    throw new Error('Connection: Database is invalid or nonexistent');
  }

  return drizzle(queryClient, { schema });
}
