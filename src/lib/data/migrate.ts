import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const maxRetries = 10;
const retryInterval = 5000; // 5 seconds

async function runMigrations() {
	for (let i = 0; i < maxRetries; i++) {
		try {
			const migrationClient = postgres(process.env.DB_PG_URL, { max: 1 });
			await migrate(drizzle(migrationClient), {
				migrationsFolder: './drizzle'
			});
			console.log('[Migrate] Migrations completed successfully.');
			process.exit();
		} catch (error) {
			console.error(
				`[Migrate] Failed to run migrations (attempt ${i + 1}/${maxRetries}): ${error}`
			);
			// Sleep before the next retry
			await new Promise((resolve) => setTimeout(resolve, retryInterval));
		}
	}

	throw `Failed to run migrations after ${maxRetries} attempts.`;
}

runMigrations();
