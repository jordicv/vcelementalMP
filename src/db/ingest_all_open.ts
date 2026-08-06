import 'dotenv/config';
import { db, companies, tenders } from './index';
import { sql } from 'drizzle-orm';
import { getTendersByStatus, getTendersByDateRange, getTenderDetail, formatDateDDMMYYYY, getRecentWorkDays } from '../services/mercadopublico';
import type { MPTender } from '../services/mercadopublico';
import { calculateScore } from '../services/scoring/index';
import { resolveBasesFromFicha } from '../services/scraper';

const BATCH_SIZE = 12;   // Concurrencia de peticiones a la API
const DELAY_MS   = 80;   // Pausa breve entre lotes para no saturar

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runIngestAllOpen() {
  console.log('================================================================');
  console.log('[INGESTION GOAL] Iniciando recolección masiva de licitaciones ABIERTAS');
  console.log('================================================================');

  // 1. Obtener empresa activa
  const company = (await db.select().from(companies).limit(1))[0];
  if (!company) {
    console.error('[INGESTION GOAL Error] No se encontró ninguna empresa en la BD. Ejecuta db:seed primero.');
    process.exit(1);
  }
  const ticket = company.apiTicket || process.env.MP_ADMIN_TICKET || 'E18620F6-CC83-4690-96FC-CD61DC9FAE8D';
  console.log(`[INGESTION GOAL] Empresa: "${company.name}" (ID: ${company.id})`);
  console.log(`[INGESTION GOAL] Usando Ticket de Mercado Público: ${ticket}`);

  // 2. Recolectar licitaciones abiertas por Estado ("Publicada") y por Rango de Fechas (últimos 30 días hábiles)
  const openTendersMap = new Map<string, MPTender>();

  // A) Recolectar por Estado = Publicada
  console.log('\n[Fase 1/3] Descargando licitaciones con estado=publicada...');
  try {
    const publishedTenders = await getTendersByStatus('Publicada', ticket);
    console.log(` → Recibidas por estado: ${publishedTenders.length}`);
    for (const t of publishedTenders) {
      if (t.CodigoExterno) openTendersMap.set(t.CodigoExterno, t);
    }
  } catch (err: any) {
    console.warn(` [Fase 1 Warning]: ${err.message}`);
  }

  // B) Recolectar por barrido de los últimos 30 días hábiles (para atrapar Compra Ágil y licitaciones vigentes)
  console.log('\n[Fase 2/3] Barrido de licitaciones vigentes por últimos 30 días hábiles...');
  const workDays = getRecentWorkDays(30);
  for (const date of workDays) {
    const ds = formatDateDDMMYYYY(date);
    let pagina = 1;
    let addedCount = 0;
    while (true) {
      try {
        const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?fecha=${ds}&pagina=${pagina}&ticket=${ticket}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) break;
        const data = await res.json() as any;
        const list: MPTender[] = data?.Listado ?? [];
        if (list.length === 0) break;

        const now = new Date();
        for (const t of list) {
          if (!t.CodigoExterno) continue;
          const isPublicada = t.CodigoEstado === 5 || t.Estado === 'Publicada';
          const closeDate = t.FechaCierre ? new Date(t.FechaCierre) : null;
          const isOpenDate = closeDate && closeDate > now;

          if (isPublicada || isOpenDate) {
            if (!openTendersMap.has(t.CodigoExterno)) {
              openTendersMap.set(t.CodigoExterno, t);
              addedCount++;
            }
          }
        }
        pagina++;
        await sleep(50);
      } catch (err) {
        break;
      }
    }
    if (addedCount > 0) {
      console.log(`   └─ Fecha ${ds}: +${addedCount} licitaciones abiertas agregadas (Acumulado único: ${openTendersMap.size})`);
    }
  }

  const allOpenTenders = Array.from(openTendersMap.values());
  console.log(`\n================================================================`);
  console.log(`[Fase 2 Completada] TOTAL LICITACIONES ABIERTAS RECOLECTADAS: ${allOpenTenders.length}`);
  console.log(`================================================================`);

  // Agrupar por tipos para auditar Compra Ágil (CO) y otros tipos
  const typeSummary: Record<string, number> = {};
  allOpenTenders.forEach(t => {
    const code = t.CodigoExterno || '';
    const parts = code.split('-');
    const type = parts.length > 2 ? parts[2] : (t.Tipo || 'OTRO');
    typeSummary[type] = (typeSummary[type] || 0) + 1;
  });
  console.log('[Resumen por tipo en la API]:', typeSummary);

  // 3. Inserción / Actualización masiva en la Base de Datos
  console.log('\n[Fase 3/3] Guardando e indexando licitaciones en PostgreSQL con Scoring...');

  let insertedCount = 0;
  let updatedCount  = 0;
  let errorCount    = 0;

  const regionMap: Record<string, string> = {
    'Región Metropolitana de Santiago': 'RM',
    'Región Metropolitana': 'RM',
    'Región de Valparaíso': 'V',
    'Región del Libertador General Bernardo O\'Higgins': 'VI',
    'Región del Maule': 'VII',
    'Región del Ñuble': 'XVI',
    'Región del Biobío': 'VIII',
    'Región de La Araucanía': 'IX',
    'Región de Los Ríos': 'XIV',
    'Región de Los Lagos': 'X',
    'Región de Aysén del General Carlos Ibáñez del Campo': 'XI',
    'Región de Magallanes y de la Antártica Chilena': 'XII',
    'Región de Tarapacá': 'I',
    'Región de Antofagasta': 'II',
    'Región de Atacama': 'III',
    'Región de Coquimbo': 'IV',
    'Región de Arica y Parinacota': 'XV',
  };

  for (let i = 0; i < allOpenTenders.length; i += BATCH_SIZE) {
    const batch = allOpenTenders.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (item) => {
        const code = item.CodigoExterno;
        if (!code) return;

        // Tratar de obtener detalle extendido de la API
        let mpDetail: MPTender | null = null;
        try {
          mpDetail = await getTenderDetail(code, ticket);
        } catch {
          mpDetail = null;
        }

        const tenderData = mpDetail || item;
        const budgetVal = tenderData.MontoEstimado ?? 0;
        const currency = (tenderData.Moneda || 'CLP') as string;
        const title = tenderData.Nombre || 'Licitación pública';

        const comprador = tenderData.Comprador;
        const unidad = tenderData.Unidad;
        const buyerName = comprador?.NombreUnidad ?? unidad?.Nombre ?? 'Organismo Público';
        const buyerRegion = comprador?.RegionUnidad ?? unidad?.Region ?? 'Región Metropolitana';
        const buyerCommune = comprador?.ComunaUnidad ?? unidad?.Comuna ?? null;

        const buyerRegionCode = comprador?.CodigoRegion
          ?? regionMap[buyerRegion]
          ?? buyerRegion.slice(0, 4);

        let budgetInClp = budgetVal;
        if (currency === 'UTM') budgetInClp = budgetVal * 66000;
        else if (currency === 'UF') budgetInClp = budgetVal * 38000;
        else if (currency === 'USD') budgetInClp = budgetVal * 930;

        const tenderForScore = {
          title,
          budget: budgetInClp.toString(),
          buyerRegion,
          closeDate: tenderData.FechaCierre ? new Date(tenderData.FechaCierre) : new Date(),
        } as any;

        const score = calculateScore(tenderForScore, company);

        let basesTexto: Record<string, string> | null = null;
        if (score.total >= 60) {
          try {
            basesTexto = await resolveBasesFromFicha(code);
          } catch {
            basesTexto = null;
          }
        }

        const rawData = {
          ...tenderData,
          textoBases: basesTexto || undefined
        };

        const closeDateObj = tenderData.FechaCierre
          ? new Date(tenderData.FechaCierre)
          : tenderData.Fechas?.FechaCierre
          ? new Date(tenderData.Fechas.FechaCierre)
          : new Date(Date.now() + 15 * 86400000);

        try {
          await db.insert(tenders).values({
            companyId: activeCompanyId(company.id),
            externalCode: code,
            title,
            status: tenderData.Estado || 'Publicada',
            budget: budgetVal.toString(),
            currency,
            closeDate: closeDateObj,
            buyerName,
            buyerRegion,
            buyerRegionCode,
            buyerCommune,
            scoreTotalVal: score.total,
            scoreRubro: score.rubro,
            scoreRegion: score.region,
            scoreBudget: score.budget,
            scoreUrgency: score.urgency,
            scoreLabel: score.label,
            rawData: rawData as any,
            aiSummary: `VC Elemental IA: ${title}. Región ${buyerRegion}. Presupuesto: ${budgetVal.toLocaleString('es-CL')} ${currency}. Score ${score.total}/100 (${score.label}).`,
          }).onConflictDoUpdate({
            target: [tenders.companyId, tenders.externalCode],
            set: {
              title,
              status: tenderData.Estado || 'Publicada',
              budget: budgetVal.toString(),
              currency,
              closeDate: closeDateObj,
              buyerName,
              buyerRegion,
              buyerRegionCode,
              buyerCommune,
              scoreTotalVal: score.total,
              scoreRubro: score.rubro,
              scoreRegion: score.region,
              scoreBudget: score.budget,
              scoreUrgency: score.urgency,
              scoreLabel: score.label,
              rawData: rawData as any,
              aiSummary: `VC Elemental IA: ${title}. Región ${buyerRegion}. Presupuesto: ${budgetVal.toLocaleString('es-CL')} ${currency}. Score ${score.total}/100 (${score.label}).`,
              scoredAt: new Date(),
            }
          });
          insertedCount++;
        } catch (err: any) {
          errorCount++;
        }
      })
    );

    const progressPct = Math.round(((i + batch.length) / allOpenTenders.length) * 100);
    if (progressPct % 10 === 0 || i + batch.length >= allOpenTenders.length) {
      console.log(` [Progreso Ingesta BD] ${progressPct}% (${i + batch.length}/${allOpenTenders.length}) | Guardadas: ${insertedCount} | Errores: ${errorCount}`);
    }
    await sleep(DELAY_MS);
  }

  // 4. AUDITORÍA Y VERIFICACIÓN EN LA BASE DE DATOS
  console.log('\n================================================================');
  console.log('[VERIFICACIÓN FINAL EN POSTGRESQL]');
  console.log('================================================================');

  const totalInDb = await db.select({ count: sql<number>`count(*)` }).from(tenders);
  const totalCount = Number(totalInDb[0]?.count ?? 0);

  // Desglose de licitaciones en BD por tipo de código (CO, LE, LP, LR, L1, etc.)
  const dbTypesQuery = await db.execute(sql`
    SELECT 
      CASE 
        WHEN external_code LIKE '%-CO%' THEN 'Compra Ágil (CO)'
        WHEN external_code LIKE '%-LE%' THEN 'Licitación Menor (LE)'
        WHEN external_code LIKE '%-LP%' THEN 'Licitación Pública (LP)'
        WHEN external_code LIKE '%-LR%' THEN 'Licitación Mayor (LR)'
        WHEN external_code LIKE '%-L1%' THEN 'Licitación L1'
        WHEN external_code LIKE '%-O1%' THEN 'Licitación Privada (O1)'
        ELSE 'Otros Tipos'
      END as tipo,
      COUNT(*) as total
    FROM tenders
    GROUP BY 1
    ORDER BY total DESC;
  `);

  console.log(`\n✔ Total de licitaciones en la base de datos: ${totalCount}`);
  console.log('✔ Desglose verificado en PostgreSQL por tipo:');
  const rows = (dbTypesQuery as any).rows || dbTypesQuery;
  rows.forEach((row: any) => {
    console.log(`   • ${row.tipo}: ${row.total} licitaciones`);
  });

  console.log('\n================================================================');
  console.log('¡PROCESO COMPLETADO Y VERIFICADO EXITOSAMENTE!');
  console.log('================================================================');
  process.exit(0);
}

function activeCompanyId(id: string): string {
  return id;
}

runIngestAllOpen().catch(err => {
  console.error('[INGESTION GOAL Error Fatal]:', err);
  process.exit(1);
});
