import type { APIRoute } from 'astro';
import { db, tenders } from '../../db/index';
import { desc, sql, count, gte, eq, ilike, and, like } from 'drizzle-orm';
import { RUBRO_KEYWORDS } from '../../services/scoring/rubro.scorer';

const INDUSTRY_PATTERNS: Array<{ name: string; regex: RegExp }> = Object.entries(RUBRO_KEYWORDS).map(([name, keywords]) => {
  const terms = keywords.map(k => {
    const escaped = k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return k.length <= 3 ? `\\b${escaped}\\b` : escaped;
  });
  return { name, regex: new RegExp(terms.join('|'), 'gi') };
});

function cleanRegionName(regionStr: string | null): string {
  if (!regionStr) return 'No especificada';
  const clean = regionStr.trim().replace(/\s+/g, ' ');
  if (clean.includes('Metropolitana') || clean.includes('Santiago')) return 'Región Metropolitana';
  if (clean.includes('Valparaíso') || clean.includes('Valparaiso')) return 'Región de Valparaíso';
  if (clean.includes('Atacama')) return 'Región de Atacama';
  if (clean.includes('Coquimbo')) return 'Región de Coquimbo';
  if (clean.includes('Antofagasta')) return 'Región de Antofagasta';
  if (clean.includes('Arica') || clean.includes('Parinacota')) return 'Región de Arica y Parinacota';
  if (clean.includes('Tarapacá') || clean.includes('Tarapaca')) return 'Región de Tarapacá';
  if (clean.includes('Libertador') || clean.includes('O\'Higgins') || clean.includes('O´Higgins')) return 'Región de O\'Higgins';
  if (clean.includes('Maule')) return 'Región del Maule';
  if (clean.includes('Ñuble') || clean.includes('Nuble')) return 'Región del Ñuble';
  if (clean.includes('Biobío') || clean.includes('Biobio') || clean.includes('Bío Bío')) return 'Región del Biobío';
  if (clean.includes('Araucanía') || clean.includes('Araucania')) return 'Región de la Araucanía';
  if (clean.includes('Los Ríos') || clean.includes('Los Rios')) return 'Región de Los Ríos';
  if (clean.includes('Los Lagos') || clean.includes('Los Lagos')) return 'Región de Los Lagos';
  if (clean.includes('Aysén') || clean.includes('Aysen') || clean.includes('Carlos Ibáñez') || clean.includes('Ibáñez')) return 'Región de Aysén';
  if (clean.includes('Magallanes')) return 'Región de Magallanes';
  return clean;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get('pageSize') || '25', 10)));
    const offset = (page - 1) * pageSize;

    const search = url.searchParams.get('search') || '';
    const region = url.searchParams.get('region') || 'all';
    const status = url.searchParams.get('status') || 'all';
    const category = url.searchParams.get('category') || 'all';
    const scoreMin = parseInt(url.searchParams.get('scoreMin') || '0', 10);
    const tab = url.searchParams.get('tab') || 'all';

    // Construcción de condiciones WHERE dinámicas
    const conditions: any[] = [];

    if (search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push(sql`(${tenders.title} ILIKE ${s} OR ${tenders.buyerName} ILIKE ${s} OR ${tenders.externalCode} ILIKE ${s})`);
    }

    if (region !== 'all') {
      conditions.push(ilike(tenders.buyerRegion, `%${region}%`));
    }

    if (status === 'Publicada') {
      // "Abiertas" = status is Publicada AND closeDate is in the future
      conditions.push(eq(tenders.status, 'Publicada'));
      conditions.push(sql`${tenders.closeDate} > NOW()`);
    } else if (status === 'Cerrada') {
      // "Cerradas" = status is Cerrada/Adjudicada OR closeDate has passed
      conditions.push(sql`(${tenders.status} IN ('Cerrada', 'Adjudicada') OR ${tenders.closeDate} <= NOW())`);
    } else if (status === 'Adjudicada') {
      conditions.push(eq(tenders.status, 'Adjudicada'));
    }

    if (scoreMin > 0) {
      conditions.push(gte(tenders.scoreTotalVal, scoreMin));
    }

    if (tab === 'recommended') {
      conditions.push(gte(tenders.scoreTotalVal, 70));
    } else if (tab === 'compra-agil') {
      conditions.push(like(tenders.externalCode, '%-CO%'));
    } else if (tab === 'closing') {
      // Cierran en los próximos 7 días y aún están abiertas
      conditions.push(sql`${tenders.closeDate} > NOW()`);
      conditions.push(sql`${tenders.closeDate} <= NOW() + INTERVAL '7 days'`);
      conditions.push(sql`${tenders.status} NOT IN ('Cerrada', 'Adjudicada')`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Obtener conteo total filtrado
    const countQuery = db.select({ total: count() }).from(tenders);
    if (whereClause) countQuery.where(whereClause);
    const countResult = await countQuery;
    const totalTendersInDb = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(totalTendersInDb / pageSize) || 1;

    // Consulta paginada
    const baseQuery = db
      .select({
        id: tenders.id,
        externalCode: tenders.externalCode,
        title: tenders.title,
        status: tenders.status,
        budget: tenders.budget,
        currency: tenders.currency,
        closeDate: tenders.closeDate,
        buyerName: tenders.buyerName,
        buyerRegion: tenders.buyerRegion,
        buyerRegionCode: tenders.buyerRegionCode,
        buyerCommune: tenders.buyerCommune,
        scoreTotalVal: tenders.scoreTotalVal,
        scoreRubro: tenders.scoreRubro,
        scoreRegion: tenders.scoreRegion,
        scoreBudget: tenders.scoreBudget,
        scoreUrgency: tenders.scoreUrgency,
        scoreLabel: tenders.scoreLabel,
        aiSummary: tenders.aiSummary,
        createdAt: tenders.createdAt,
        description: sql<string>`${tenders.rawData}->>'Descripcion'`,
        objetivo: sql<string>`${tenders.rawData}->>'Objetivo'`,
        fechaPublicacion: sql<string>`${tenders.rawData}->>'FechaPublicacion'`,
      })
      .from(tenders);

    if (whereClause) baseQuery.where(whereClause);

    const rows = await baseQuery
      .orderBy(desc(tenders.scoreTotalVal))
      .limit(pageSize)
      .offset(offset);

    let items = rows.map(t => {
      const budgetVal = t.budget ? parseFloat(t.budget) : 0;
      const tenderDesc = t.description || t.objetivo || '';
      const textCleaned = ` ${t.title} ${t.aiSummary || ''} ${tenderDesc} `.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ");
      let detectedIndustry = 'Otros';
      let maxMatches = 0;

      for (const item of INDUSTRY_PATTERNS) {
        const matches = (textCleaned.match(item.regex) || []).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          detectedIndustry = item.name;
        }
      }

      const closeDateObj = t.closeDate ? new Date(t.closeDate) : new Date(Date.now() + 10 * 86400000);
      const daysVal = Math.floor((closeDateObj.getTime() - Date.now()) / 86400000);
      const isClosed = t.status === 'Cerrada' || t.status === 'Adjudicada' || daysVal <= 0;

      return {
        id:           t.id,
        externalCode: t.externalCode,
        title:        t.title,
        status:       isClosed ? 'Cerrada' : (t.status || 'Publicada'),
        budget:       budgetVal,
        currency:     t.currency || 'CLP',
        publishDate:  t.fechaPublicacion ? new Date(t.fechaPublicacion) : (t.createdAt || new Date()),
        closeDate:    closeDateObj,
        buyerName:    t.buyerName || 'Organismo Público',
        buyerRegion:  t.buyerRegion || 'Región Metropolitana',
        buyerCommune: t.buyerCommune || null,
        scoreTotal:   t.scoreTotalVal ?? 0,
        scoreRubro:   t.scoreRubro ?? 0,
        scoreRegion:  t.scoreRegion ?? 0,
        scoreBudget:  t.scoreBudget ?? 0,
        scoreUrgency: t.scoreUrgency ?? 0,
        scoreLabel:   t.scoreLabel || 'Evaluar',
        detectedIndustry,
        aiSummary:    t.aiSummary || 'Monitoreo de recomendación IA activo para este rubro. Haz clic para ver el desglose.',
        normalizedRegion: cleanRegionName(t.buyerRegion),
      };
    });

    // Post-filtro estricto por estado computado y rubro
    if (status !== 'all') {
      items = items.filter(t => {
        if (status === 'Publicada') return t.status === 'Publicada';
        if (status === 'Cerrada') return t.status === 'Cerrada' || t.status === 'Adjudicada';
        if (status === 'Adjudicada') return t.status === 'Adjudicada';
        return true;
      });
    }

    if (category !== 'all') {
      items = items.filter(t => t.detectedIndustry === category);
    }

    return new Response(JSON.stringify({
      success: true,
      page,
      pageSize,
      totalTenders: totalTendersInDb,
      totalPages,
      items
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
};
