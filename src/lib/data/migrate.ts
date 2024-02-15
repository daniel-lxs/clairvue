import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

const sqlite = new Database('./src/lib/data/sqlite.db', { create: true });
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: './drizzle' });
