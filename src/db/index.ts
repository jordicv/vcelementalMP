import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[DB Warning] DATABASE_URL no está configurada. Las consultas a la base de datos fallarán.');
}

const client = postgres(connectionString || 'postgresql://localhost:5432/placeholder_db', { max: 10 });
export const db = drizzle(client, { schema });
export * from './schema';
