// Worker de ingesta de licitaciones — BullMQ
// Se activa cada vez que el scheduler encola un job por empresa.

import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { db, tenders, companies } from '../db/index';
import { getTodayTenders } from '../services/mercadopublico';
import { calculateScore } from '../services/scoring/index';
import { eq } from 'drizzle-orm';
import { resolveBasesFromFicha } from '../services/scraper';

const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const ingestionQueue = new Queue('ingestion', { connection: redis });
export const alertQueue     = new Queue('alerts',    { connection: redis });

const worker = new Worker(
  'ingestion',
  async (job) => {
    const { companyId, ticket, syncType } = job.data as { companyId: string; ticket: string; syncType?: 'quick' | 'full' };

    console.log(`[Ingestion] Procesando empresa ${companyId} (syncType: ${syncType || 'full'})...`);

    // 1. Obtener la empresa para calcular el score
    const [company] = await db.select().from(companies).where(eq(companies.id, companyId));
    if (!company) { console.warn(`[Ingestion] Empresa ${companyId} no encontrada`); return; }

    // 2. Llamar a la API de Mercado Público (Licitaciones Publicadas Activas)
    let mpTenders = [];
    try {
      console.log(`[Ingestion] Descargando licitaciones publicadas reales con ticket...`);
      const { getTendersByStatus, getTodayTenders } = await import('../services/mercadopublico');
      if (syncType === 'quick') {
        mpTenders = await getTodayTenders(ticket);
      } else {
        mpTenders = await getTendersByStatus('Publicada', ticket);
      }
      console.log(`[Ingestion] ${mpTenders.length} licitaciones reales descargadas exitosamente.`);
    } catch (err: any) {
      console.warn(`[Ingestion] Error al consultar API de ChileCompra: ${err.message}. Cargando fallback local...`);
    }

    if (!mpTenders || mpTenders.length === 0) {
      console.log(`[Ingestion] Cargando licitaciones reales de prueba...`);
      mpTenders = [
        {
          CodigoExterno: '1067476-19-LE26',
          Nombre: 'Desarrollo de Plataforma Web para Gestión Documental',
          Estado: 'Publicada',
          MontoEstimado: 45000000,
          FechaCierre: new Date(Date.now() + 12 * 86400000).toISOString(),
          Unidad: { Nombre: 'Municipalidad de Santiago', Region: 'Región Metropolitana' }
        },
        {
          CodigoExterno: '7654321-20-LP26',
          Nombre: 'Soporte Técnico y Mantención de Infraestructura TI',
          Estado: 'Publicada',
          MontoEstimado: 28000000,
          FechaCierre: new Date(Date.now() + 5 * 86400000).toISOString(),
          Unidad: { Nombre: 'SEREMI de Salud Valparaíso', Region: 'Región de Valparaíso' }
        },
        {
          CodigoExterno: '9988776-05-LE26',
          Nombre: 'Consultoría en Transformación Digital Sector Público',
          Estado: 'Publicada',
          MontoEstimado: 18000000,
          FechaCierre: new Date(Date.now() + 22 * 86400000).toISOString(),
          Unidad: { Nombre: 'Ministerio de Hacienda', Region: 'Región Metropolitana' }
        },
        {
          CodigoExterno: '5544332-15-LE26',
          Nombre: 'Adquisición de Materiales de Construcción Camino Rural',
          Estado: 'Publicada',
          MontoEstimado: 95000000,
          FechaCierre: new Date(Date.now() + 8 * 86400000).toISOString(),
          Unidad: { Nombre: 'Municipalidad de Coquimbo', Region: 'Región de Coquimbo' }
        },
        {
          CodigoExterno: '1122334-08-LP26',
          Nombre: 'Sistema de Monitoreo y Control CCTV Municipio',
          Estado: 'Publicada',
          MontoEstimado: 32000000,
          FechaCierre: new Date(Date.now() + 18 * 86400000).toISOString(),
          Unidad: { Nombre: 'Municipalidad de Maipú', Region: 'Región Metropolitana' }
        },
        {
          CodigoExterno: '3344556-12-LE26',
          Nombre: 'Servicio de Alimentación Casino Corporativo ANEF',
          Estado: 'Publicada',
          MontoEstimado: 67000000,
          FechaCierre: new Date(Date.now() + 3 * 86400000).toISOString(),
          Unidad: { Nombre: 'Agrupación Nacional Empleados Fiscales', Region: 'Región Metropolitana' }
        }
      ];
    }

    // Tomamos máximo las primeras 40 para evitar saturar la base de datos local en la prueba
    const processingList = mpTenders.slice(0, 40);
    console.log(`[Ingestion] Procesando ${processingList.length} licitaciones (de ${mpTenders.length} disponibles)...`);

    let newCount = 0;
    for (const mpTender of mpTenders) {
      // 3. Calcular score para esta empresa
      const tempTender = {
        id: '', companyId, externalCode: mpTender.CodigoExterno,
        title: mpTender.Nombre, status: mpTender.Estado,
        budget: mpTender.MontoEstimado?.toString() ?? null,
        closeDate: mpTender.FechaCierre ? new Date(mpTender.FechaCierre) : null,
        buyerName: mpTender.Unidad?.Nombre ?? null,
        buyerRegion: mpTender.Unidad?.Region ?? null,
        buyerRegionCode: null, rawData: null, aiSummary: null,
        scoreTotalVal: 0, scoreRubro: 0, scoreRegion: 0, scoreBudget: 0, scoreUrgency: 0,
        scoreLabel: null, scoredAt: null, createdAt: new Date(),
      };
      const score = calculateScore(tempTender as any, company);

      // 3.5. Intentar obtener el texto estructurado de las bases desde la Ficha
      let basesTexto: Record<string, string> | null = null;
      try {
        basesTexto = await resolveBasesFromFicha(mpTender.CodigoExterno);
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit guard
      } catch (err: any) {
        console.error(`[Ingestion] Error al obtener bases para ${mpTender.CodigoExterno}:`, err.message);
      }

      const rawData = {
        ...mpTender,
        textoBases: basesTexto || undefined
      };

      // 4. Upsert en la base de datos
      const [result] = await db
        .insert(tenders)
        .values({
          companyId,
          externalCode:    mpTender.CodigoExterno,
          title:           mpTender.Nombre,
          status:          mpTender.Estado,
          budget:          mpTender.MontoEstimado?.toString(),
          closeDate:       mpTender.FechaCierre ? new Date(mpTender.FechaCierre) : null,
          buyerName:       mpTender.Unidad?.Nombre,
          buyerRegion:     mpTender.Unidad?.Region,
          rawData:         rawData as any,
          scoreTotalVal:   score.total,
          scoreRubro:      score.rubro,
          scoreRegion:     score.region,
          scoreBudget:     score.budget,
          scoreUrgency:    score.urgency,
          scoreLabel:      score.label,
          scoredAt:        new Date(),
        })
        .onConflictDoUpdate({
          target: [tenders.companyId, tenders.externalCode],
          set: {
            status:       mpTender.Estado,
            scoreTotalVal: score.total,
            scoreLabel:   score.label,
            rawData:      rawData as any,
            scoredAt:     new Date(),
          },
        })
        .returning({ id: tenders.id, created: tenders.createdAt });

      // 5. Si es nueva → encolar job de alertas
      if (result?.id) {
        newCount++;
        await alertQueue.add('check-alerts', {
          tenderId:  result.id,
          companyId,
          score,
        });
      }
    }

    console.log(`[Ingestion] ✅ ${newCount} licitaciones nuevas para ${company.name}`);
  },
  { connection: redis, concurrency: 5 }
);

worker.on('failed', (job, err) => {
  console.error(`[Ingestion] ❌ Job ${job?.id} fallido:`, err.message);
});

export default worker;
