import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  console.log('[Migration] Conectando a la base de datos...');
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('[Migration] Ejecutando migraciones pendientes...');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });

  console.log('[Migration] ✅ ¡Migraciones aplicadas con éxito!');
  await sql.end();
}

main().catch(err => {
  console.error('[Migration Fatal Error]:', err);
  process.exit(1);
});
