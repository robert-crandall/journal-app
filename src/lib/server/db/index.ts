import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

let _db: ReturnType<typeof drizzle> | null = null;

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
	get(target, prop) {
		if (!_db) {
			if (!env.DATABASE_URL) {
				throw new Error('DATABASE_URL is not set');
			}
			const client = postgres(env.DATABASE_URL);
			_db = drizzle(client, { schema });
		}
		return (_db as any)[prop];
	}
});
