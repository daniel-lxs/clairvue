import postgres from 'postgres';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';

const queryClient = postgres(process.env.PRIVATE_DB_URL, {
	keep_alive: 30000
});

export function getClient() {
	if (!queryClient) {
		throw new Error('Connection: Database is invalid or nonexistent');
	}

	return drizzle(queryClient, { schema });
}

export const adapter = new DrizzlePostgreSQLAdapter(
	getClient(),
	schema.sessionSchema,
	schema.userSchema
);
