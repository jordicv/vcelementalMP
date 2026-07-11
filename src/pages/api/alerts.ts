import 'dotenv/config';
import type { APIRoute } from 'astro';
import { db, alerts, companies, users } from '../../db/index';
import { eq, and } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { emailActive, whatsappActive, scoreThreshold, keywords, exclude } = body;

    // Obtener la empresa y usuario activo de prueba (seed)
    const company = (await db.select().from(companies).limit(1))[0];
    if (!company) {
      return new Response(JSON.stringify({ error: 'Empresa no encontrada' }), { status: 400 });
    }
    const user = (await db.select().from(users).where(eq(users.companyId, company.id)).limit(1))[0];
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 400 });
    }

    const filters = {
      minScore: parseInt(scoreThreshold || '70'),
      keywords: keywords || [],
      exclude: exclude || [],
    };

    // Upsert para email
    const [existingEmail] = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.userId, user.id), eq(alerts.channel, 'email')));

    if (existingEmail) {
      await db
        .update(alerts)
        .set({ isActive: emailActive, filters, createdAt: new Date() })
        .where(eq(alerts.id, existingEmail.id));
    } else {
      await db.insert(alerts).values({
        userId:      user.id,
        companyId:   company.id,
        channel:     'email',
        triggerType: 'score_match',
        filters,
        isActive:    emailActive,
      });
    }

    // Upsert para whatsapp
    const [existingWhatsapp] = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.userId, user.id), eq(alerts.channel, 'whatsapp')));

    if (existingWhatsapp) {
      await db
        .update(alerts)
        .set({ isActive: whatsappActive, filters, createdAt: new Date() })
        .where(eq(alerts.id, existingWhatsapp.id));
    } else {
      await db.insert(alerts).values({
        userId:      user.id,
        companyId:   company.id,
        channel:     'whatsapp',
        triggerType: 'score_match',
        filters,
        isActive:    whatsappActive,
      });
    }

    console.log('[API Alerts] Configuración guardada en DB con éxito.');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[API Alerts Error]:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
