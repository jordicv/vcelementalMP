import 'dotenv/config';
import type { APIRoute } from 'astro';
import { db, companies, tenders } from '../../../db/index';
import { eq } from 'drizzle-orm';
import { calculateScore } from '../../../services/scoring/index';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { industry, region, apiTicket, budgetMin, budgetMax } = body;

    // Obtener la empresa activa (seed)
    const company = (await db.select().from(companies).limit(1))[0];
    if (!company) {
      return new Response(JSON.stringify({ error: 'Empresa no encontrada' }), { status: 400 });
    }

    // Actualizar empresa en la base de datos
    await db
      .update(companies)
      .set({
        industry,
        region,
        apiTicket,
        budgetMin: (budgetMin !== undefined && budgetMin !== null && budgetMin !== '') ? budgetMin.toString() : '0',
        budgetMax: (budgetMax !== undefined && budgetMax !== null && budgetMax !== '') ? budgetMax.toString() : '0',
      })
      .where(eq(companies.id, company.id));

    // Obtener la info actualizada de la empresa
    const [updatedCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, company.id));

    // Recalcular scores de todas las licitaciones guardadas
    const list = await db
      .select()
      .from(tenders)
      .where(eq(tenders.companyId, updatedCompany.id));

    for (const tender of list) {
      const score = calculateScore(tender as any, updatedCompany);

      await db
        .update(tenders)
        .set({
          scoreTotalVal: score.total,
          scoreRubro:    score.rubro,
          scoreRegion:   score.region,
          scoreBudget:   score.budget,
          scoreUrgency:  score.urgency,
          scoreLabel:    score.label,
          scoredAt:      new Date(),
        })
        .where(eq(tenders.id, tender.id));
    }

    console.log(`[API Config] Perfil actualizado para ${updatedCompany.name}. ${list.length} licitaciones recalculadas.`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[API Config Error]:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
