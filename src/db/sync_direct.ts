import 'dotenv/config';
import { db, companies, tenders } from './index';
import { eq, inArray } from 'drizzle-orm';
import { getTendersByStatus, getTenderDetail } from '../services/mercadopublico';
import { calculateScore } from '../services/scoring/index';
import { resolveBasesFromFicha } from '../services/scraper';

const BATCH_SIZE   = 5;   // llamadas paralelas a la API de detalle
const DELAY_MS     = 200; // pausa entre lotes (evitar rate-limit 429)
const MAX_TENDERS  = 300; // máximo a procesar por ejecución (ajustar si se quiere más)

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDirectSync() {
  console.log('[Direct Sync] Iniciando descarga completa de licitaciones reales...');

  // 1. Obtener la empresa activa
  const company = (await db.select().from(companies).limit(1))[0];
  if (!company) {
    console.error('[Direct Sync] Empresa no encontrada. Corre el seed primero.');
    process.exit(1);
  }
  console.log(`[Direct Sync] Empresa: ${company.name} | Ticket: ${company.apiTicket}`);

  // 2. Obtener lista de licitaciones desde la API
  let mpTenders: any[] = [];
  try {
    mpTenders = await getTendersByStatus('Publicada', company.apiTicket);
    console.log(`[Direct Sync] ${mpTenders.length} licitaciones obtenidas desde la API.`);
  } catch (err: any) {
    console.error('[Direct Sync Error API]:', err.message);
    process.exit(1);
  }

  if (mpTenders.length === 0) {
    console.warn('[Direct Sync] La API retornó 0 licitaciones. Verifica el ticket.');
    process.exit(0);
  }

  // 3. Obtener existentes y las que tienen budget nulo
  const allCodes = mpTenders.map((t: any) => t.CodigoExterno).filter(Boolean);
  const existing = await db.select({ code: tenders.externalCode, budget: tenders.budget })
    .from(tenders)
    .where(inArray(tenders.externalCode, allCodes.slice(0, 1000))); // Postgres limit
  const existingSet = new Set(existing.map((e: any) => e.code));
  const existingWithBudgetSet = new Set(existing.filter((e: any) => e.budget !== null).map((e: any) => e.code));

  const toProcess = mpTenders
    .filter((t: any) => t.CodigoExterno && (!existingSet.has(t.CodigoExterno) || !existingWithBudgetSet.has(t.CodigoExterno)))
    .slice(0, MAX_TENDERS);

  console.log(`[Direct Sync] A procesar (nuevas o sin presupuesto): ${toProcess.length} (con presupuesto en BD: ${existingWithBudgetSet.size})`);

  if (toProcess.length === 0) {
    console.log('[Direct Sync] No hay nuevas licitaciones ni licitaciones sin presupuesto que procesar. La BD está al día.');
    process.exit(0);
  }

  // 4. Procesar en lotes paralelos
  let insertCount = 0;
  let errorCount  = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (item: any) => {
        const code = item.CodigoExterno;
        let mpTender: any = null;

        try {
          mpTender = await getTenderDetail(code, company.apiTicket);
        } catch (err: any) {
          console.warn(`[Direct Sync] Sin detalle para ${code}: ${err.message}`);
          return null;
        }

        if (!mpTender) return null;

        const budgetVal   = mpTender.MontoEstimado ?? 0;
        const currency    = (mpTender.Moneda || 'CLP') as string;
        const title       = mpTender.Nombre || 'Licitación sin título';
        const description = mpTender.Descripcion || '';

        // El endpoint de detalle devuelve 'Comprador'; el de lista devuelve 'Unidad'
        const comprador = mpTender.Comprador;
        const unidad    = mpTender.Unidad;
        const buyerName    = comprador?.NombreUnidad ?? unidad?.Nombre ?? 'Organismo Público';
        const buyerRegion  = comprador?.RegionUnidad ?? unidad?.Region ?? 'Región Metropolitana';
        const buyerCommune = comprador?.ComunaUnidad ?? unidad?.Comuna ?? null;

        // Código de región: usar el campo real si existe, si no extraer las primeras letras
        const regionMap: Record<string,string> = {
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
        const buyerRegionCode = comprador?.CodigoRegion
          ?? regionMap[buyerRegion]
          ?? buyerRegion.slice(0, 4);

        // Conversión a CLP para el score de presupuesto
        let budgetInClp = budgetVal;
        if (currency === 'UTM') budgetInClp = budgetVal * 66000;
        else if (currency === 'UF')  budgetInClp = budgetVal * 38000;
        else if (currency === 'USD') budgetInClp = budgetVal * 930;

        // Score usando el título real de la licitación
        const tenderForScore = {
          title,
          budget:      budgetInClp.toString(),
          buyerRegion,
          closeDate:   mpTender.FechaCierre ? new Date(mpTender.FechaCierre) : new Date(),
        } as any;
        const score = calculateScore(tenderForScore, company);

        let basesTexto: Record<string, string> | null = null;
        try {
          basesTexto = await resolveBasesFromFicha(code);
        } catch (err: any) {
          console.error(`[Direct Sync] Error al obtener bases para ${code}:`, err.message);
        }

        const rawData = {
          ...mpTender,
          textoBases: basesTexto || undefined
        };

        await db.insert(tenders).values({
          companyId:       company.id,
          externalCode:    code,
          title,
          status:          mpTender.Estado || 'Publicada',
          budget:          budgetVal.toString(),
          currency,
          closeDate:       mpTender.FechaCierre
                           ?? mpTender.Fechas?.FechaCierre
                             ? new Date(mpTender.FechaCierre ?? mpTender.Fechas!.FechaCierre!)
                             : new Date(Date.now() + 10 * 86400000),
          buyerName,
          buyerRegion,
          buyerRegionCode,
          buyerCommune,
          scoreTotalVal:   score.total,
          scoreRubro:      score.rubro,
          scoreRegion:     score.region,
          scoreBudget:     score.budget,
          scoreUrgency:    score.urgency,
          scoreLabel:      score.label,
          rawData:         rawData as any,
          aiSummary:       `VC Elemental IA: Licitación en ${buyerRegion} con presupuesto de ${budgetVal.toLocaleString('es-CL')} ${currency}. Score ${score.total}/100 — ${score.label}.`,
        }).onConflictDoUpdate({
          target: [tenders.companyId, tenders.externalCode],
          set: {
            title,
            status:          mpTender.Estado || 'Publicada',
            budget:          budgetVal.toString(),
            currency,
            closeDate:       mpTender.FechaCierre
                             ?? mpTender.Fechas?.FechaCierre
                               ? new Date(mpTender.FechaCierre ?? mpTender.Fechas!.FechaCierre!)
                               : new Date(Date.now() + 10 * 86400000),
            buyerName,
            buyerRegion,
            buyerRegionCode,
            buyerCommune,
            scoreTotalVal:   score.total,
            scoreRubro:      score.rubro,
            scoreRegion:     score.region,
            scoreBudget:     score.budget,
            scoreUrgency:    score.urgency,
            scoreLabel:      score.label,
            rawData:         rawData as any,
            aiSummary:       `VC Elemental IA: Licitación en ${buyerRegion} con presupuesto de ${budgetVal.toLocaleString('es-CL')} ${currency}. Score ${score.total}/100 — ${score.label}.`,
            scoredAt:        new Date(),
          }
        });

        return code;
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) insertCount++;
      else if (result.status === 'rejected') errorCount++;
    }

    const pct = Math.round(((i + batch.length) / toProcess.length) * 100);
    console.log(`[Direct Sync] Progreso: ${pct}% | Insertadas: ${insertCount} | Errores: ${errorCount}`);

    // Pausa entre lotes para no saturar la API
    if (i + BATCH_SIZE < toProcess.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n[Direct Sync] ✅ Completado.`);
  console.log(`  → Insertadas: ${insertCount}`);
  console.log(`  → Errores/sin detalle: ${errorCount}`);
  console.log(`  → Ya existían en BD: ${existingSet.size}`);
  process.exit(0);
}

runDirectSync().catch(err => {
  console.error('[Direct Sync Fatal]:', err);
  process.exit(1);
});
