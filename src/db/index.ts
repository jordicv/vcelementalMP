import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[DB Warning] DATABASE_URL no está configurada. Las consultas a la base de datos fallarán.');
}

// Detectar entorno de producción (Vercel) o conexiones a Supabase / Neon en la nube
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
const isSupabaseOrCloud = !!connectionString && (
  connectionString.includes('supabase') ||
  connectionString.includes('pooler') ||
  connectionString.includes('neon.tech') ||
  isProduction
);

// En Supabase Pooler (puerto 6543 / Supavisor / PgBouncer), los Prepared Statements no son soportados por el pooler de transacciones.
// Desactivar `prepare` y forzar SSL según el entorno garantiza compatibilidad 100% en Supabase / Vercel.
const globalForDb = globalThis as unknown as { conn: ReturnType<typeof postgres> | undefined };

const client = globalForDb.conn ?? postgres(connectionString || 'postgresql://localhost:5432/placeholder_db', {
  max: isProduction ? 1 : 10,
  prepare: false, // Requerido para Supabase Transaction Pooler (PgBouncer / Supavisor)
  ssl: isSupabaseOrCloud ? { rejectUnauthorized: false } : false,
  idle_timeout: 20,
  connect_timeout: 10,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = client;
}

export const db = drizzle(client, { schema });
export * from './schema';

