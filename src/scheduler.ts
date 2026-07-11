// Scheduler principal — encola jobs de ingesta cada 15 minutos por empresa
import 'dotenv/config';
import cron from 'node-cron';
import { ingestionQueue } from './workers/ingestion.worker';
import { db, companies } from './db/index';
import { isNotNull, eq } from 'drizzle-orm';

console.log('[Scheduler] 🚀 Iniciando VC Elemental MP Scheduler...');

async function enqueueAllCompanies(syncType: 'quick' | 'full' = 'quick') {
  const activeCompanies = await db
    .select({ id: companies.id, name: companies.name, ticket: companies.apiTicket })
    .from(companies)
    .where(isNotNull(companies.apiTicket));

  // Siempre incluir la empresa admin con el ticket maestro
  const adminTicket = process.env.MP_ADMIN_TICKET;
  const list = activeCompanies.length > 0 ? activeCompanies : [];

  if (adminTicket && !list.find(c => c.ticket === adminTicket)) {
    // Encolar con ticket admin para pruebas si no hay empresas aún
    await ingestionQueue.add('fetch-tenders-admin', {
      companyId: 'admin-test',
      ticket:    adminTicket,
      syncType,
    });
    console.log(`[Scheduler] ▶ Job encolado para ticket admin (syncType: ${syncType})`);
    return;
  }

  for (const company of list) {
    await ingestionQueue.add(`fetch-${company.id}`, {
      companyId: company.id,
      ticket:    company.ticket,
      syncType,
    });
  }
  console.log(`[Scheduler] ✅ ${list.length} jobs encolados (syncType: ${syncType})`);
}

// Sincronización rápida durante el día (cada hora)
cron.schedule('0 * * * *', async () => {
  console.log(`[Scheduler] ⏰ ${new Date().toISOString()} — Ejecutando sincronización rápida diaria...`);
  await enqueueAllCompanies('quick').catch(err => console.error('[Scheduler] Error en sync rápida:', err));
});

// Sincronización completa profunda durante la noche (2:00 AM)
cron.schedule('0 2 * * *', async () => {
  console.log(`[Scheduler] ⏰ ${new Date().toISOString()} — Ejecutando sincronización completa nocturna...`);
  await enqueueAllCompanies('full').catch(err => console.error('[Scheduler] Error en sync completa:', err));
});

// Al iniciar el scheduler, encolamos una sincronización rápida para validar la conexión
enqueueAllCompanies('quick').catch(console.error);
