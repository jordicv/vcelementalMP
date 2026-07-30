import type { APIRoute } from 'astro';
import { db, tenders } from '../../db/index';
import { count } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const result = await db.select({ total: count() }).from(tenders);
    const total = result[0]?.total ?? 0;
    return new Response(JSON.stringify({ success: true, totalInSupabase: total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
