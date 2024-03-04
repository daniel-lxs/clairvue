import type { Config } from 'drizzle-kit';

export default {
	schema: 'src/lib/server/data/schema/*',
	out: './drizzle',
	driver: 'pg',
	dbCredentials: {
		connectionString: process.env.PRIVATE_DB_URL
	}
} satisfies Config;
