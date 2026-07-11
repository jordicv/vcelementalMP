import 'dotenv/config';
import type { APIRoute } from 'astro';
import { db, companies, tenders } from '../../db/index';
import { inArray } from 'drizzle-orm';
import { getTodayTenders, getTenderDetail } from '../../services/mercadopublico';
import { calculateScore } from '../../services/scoring/index';
import { resolveBasesFromFicha } from '../../services/scraper';

const BATCH_SIZE  = 5;
const DELAY_MS    = 150;
const MAX_TENDERS = 150; // Límite para evitar timeouts en HTTP

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const POST: APIRoute = async ({ request }) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[API Sync] Intento de acceso no autorizado.');
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      try {
        const company = (await db.select().from(companies).limit(1))[0];
        if (!company) {
          send({ error: 'Empresa no encontrada' });
          controller.close();
          return;
        }

        console.log('[API Sync] Iniciando sincronización manual rápida para:', company.name);
        send({ status: 'fetching', percent: 2, message: 'Conectando con ChileCompra...' });

        // 1. Obtener lista de licitaciones de hoy desde la API (tiempo real rápido)
        const mpTenders = await getTodayTenders(company.apiTicket || '');
        if (!mpTenders || mpTenders.length === 0) {
          send({ status: 'complete', percent: 100, message: 'Al día. No se encontraron licitaciones nuevas.' });
          controller.close();
          return;
        }

        send({ status: 'filtering', percent: 5, message: 'Filtrando licitaciones nuevas...' });

        // 2. Filtrar las que ya existen en la base de datos
        const allCodes = mpTenders.map((t: any) => t.CodigoExterno).filter(Boolean);
        const existing = await db
          .select({ code: tenders.externalCode, budget: tenders.budget })
          .from(tenders)
          .where(inArray(tenders.externalCode, allCodes.slice(0, 1000)));

        const existingSet = new Set(existing.map((e: any) => e.code));
        const existingWithBudgetSet = new Set(existing.filter((e: any) => e.budget !== null).map((e: any) => e.code));

        const toProcess = mpTenders
          .filter((t: any) => t.CodigoExterno && (!existingSet.has(t.CodigoExterno) || !existingWithBudgetSet.has(t.CodigoExterno)))
          .slice(0, MAX_TENDERS);

        console.log(`[API Sync] Licitaciones nuevas a procesar: ${toProcess.length}`);

        if (toProcess.length === 0) {
          send({ status: 'complete', percent: 100, message: 'Al día. La base de datos está al día.' });
          controller.close();
          return;
        }

        send({ status: 'syncing', percent: 8, message: `Iniciando: 0 de ${toProcess.length} procesadas` });

        // 3. Procesar en lotes paralelos
        let insertCount = 0;

        for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
          const batch = toProcess.slice(i, i + BATCH_SIZE);

          await Promise.allSettled(
            batch.map(async (item: any) => {
              const code = item.CodigoExterno;
              let mpTender: any = null;

              try {
                mpTender = await getTenderDetail(code, company.apiTicket || '');
              } catch (err: any) {
                console.warn(`[API Sync] Sin detalle para ${code}: ${err.message}`);
                return;
              }

              if (!mpTender) return;

              const budgetVal = mpTender.MontoEstimado ?? 0;
              const currency  = (mpTender.Moneda || 'CLP') as string;
              const title     = mpTender.Nombre || 'Licitación sin título';

              const comprador = mpTender.Comprador;
              const unidad    = mpTender.Unidad;
              const buyerName    = comprador?.NombreUnidad ?? unidad?.Nombre ?? 'Organismo Público';
              const buyerRegion  = comprador?.RegionUnidad ?? unidad?.Region ?? 'Región Metropolitana';
              const buyerCommune = comprador?.ComunaUnidad ?? unidad?.Comuna ?? null;

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
              const buyerRegionCode = comprador?.CodigoRegion
                ?? regionMap[buyerRegion]
                ?? buyerRegion.slice(0, 4);

              // Conversión a CLP para el cálculo del score de presupuesto
              let budgetInClp = budgetVal;
              if (currency === 'UTM') budgetInClp = budgetVal * 66000;
              else if (currency === 'UF')  budgetInClp = budgetVal * 38000;
              else if (currency === 'USD') budgetInClp = budgetVal * 930;

              // Calcular score
              const tenderForScore = {
                title,
                budget:    budgetInClp.toString(),
                buyerRegion,
                closeDate: mpTender.FechaCierre ? new Date(mpTender.FechaCierre) : new Date(),
              } as any;
              const score = calculateScore(tenderForScore, company);

              // OBTENER BASES (SCRAPING): Solo si es recomendada (score >= 60)
              let basesTexto: Record<string, string> | null = null;
              if (score.total >= 60) {
                try {
                  basesTexto = await resolveBasesFromFicha(code);
                } catch (err: any) {
                  console.error(`[API Sync] Error al obtener bases para ${code}:`, err.message);
                }
              }

              const rawData = {
                ...mpTender,
                textoBases: basesTexto || undefined
              };

              // Determinar estado final de cierre
              const closeDateObj = mpTender.FechaCierre
                ?? mpTender.Fechas?.FechaCierre
                ? new Date(mpTender.FechaCierre ?? mpTender.Fechas!.FechaCierre!)
                : new Date(Date.now() + 10 * 86400000);
              
              const daysVal = Math.floor((closeDateObj.getTime() - Date.now()) / 86400000);
              const isClosed = mpTender.Estado === 'Cerrada' || mpTender.Estado === 'Adjudicada' || daysVal <= 0;
              const finalStatus = isClosed ? 'Cerrada' : (mpTender.Estado || 'Publicada');

              await db.insert(tenders)
                .values({
                  companyId:       company.id,
                  externalCode:    code,
                  title,
                  status:          finalStatus,
                  budget:          budgetVal.toString(),
                  currency,
                  closeDate:       closeDateObj,
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
                })
                .onConflictDoUpdate({
                  target: [tenders.companyId, tenders.externalCode],
                  set: {
                    title,
                    status:          finalStatus,
                    budget:          budgetVal.toString(),
                    currency,
                    closeDate:       closeDateObj,
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

              insertCount++;
            })
          );

          // Calcular porcentaje (comienza en 8% y termina en 98%)
          const processedCount = i + batch.length;
          const progressPercent = 8 + Math.round((processedCount / toProcess.length) * 90);
          send({
            status: 'syncing',
            percent: progressPercent,
            message: `Procesando: ${processedCount} de ${toProcess.length} (${progressPercent}%)`
          });

          // Pequeña pausa para no saturar la API
          if (i + BATCH_SIZE < toProcess.length) {
            await sleep(DELAY_MS);
          }
        }

        console.log(`[API Sync] Sincronización finalizada. Nuevas: ${insertCount}`);
        send({ status: 'complete', percent: 100, message: `¡Completado! Actualizadas ${insertCount} licitaciones.` });
        controller.close();
      } catch (err: any) {
        console.error('[API Sync Error]:', err.message);
        send({ error: err.message });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
};
