import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const sqlite = new Database('./src/lib/data/sqlite.db', { fileMustExist: true });
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: './drizzle' });
