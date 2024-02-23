import postgres from 'postgres';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import { PRIVATE_DB_URL } from '$env/static/private';

const queryClient = postgres(PRIVATE_DB_URL, {
	keep_alive: 30000
});

export function getClient() {
	if (!queryClient) {
		throw new Error('Connection: Database is invalid or nonexistent');
	}

	return drizzle(queryClient, { schema });
}
