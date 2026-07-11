import { defineMiddleware } from 'astro:middleware';
import { db, sessions, users, companies } from './db';
import { eq } from 'drizzle-orm';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, locals } = context;
  const path = url.pathname;

  // Rutas a proteger: todo lo que empiece por /dashboard o APIs internas de configuración/alertas
  const isDashboard = path.startsWith('/dashboard');
  const isProtectedApi = path.startsWith('/api/alerts') || path.startsWith('/api/company');

  if (isDashboard || isProtectedApi) {
    const sessionToken = cookies.get('session_token')?.value;

    if (!sessionToken) {
      return redirect('/login');
    }

    try {
      // Buscar la sesión activa en Supabase
      const sessionResult = await db
        .select({
          session: sessions,
          user: users,
          company: companies,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(eq(sessions.id, sessionToken))
        .limit(1);

      const sessionData = sessionResult[0];

      if (!sessionData) {
        cookies.delete('session_token', { path: '/' });
        return redirect('/login');
      }

      // Validar si la sesión ha expirado
      if (new Date() > new Date(sessionData.session.expiresAt)) {
        await db.delete(sessions).where(eq(sessions.id, sessionToken));
        cookies.delete('session_token', { path: '/' });
        return redirect('/login');
      }

      // Compartir el usuario y empresa autenticados en los locals de Astro
      locals.user = {
        id:    sessionData.user.id,
        email: sessionData.user.email,
        name:  sessionData.user.name,
        role:  sessionData.user.role as any,
      };

      locals.company = {
        id:        sessionData.company.id,
        name:      sessionData.company.name,
        industry:  sessionData.company.industry,
        region:    sessionData.company.region,
        apiTicket: sessionData.company.apiTicket,
      };

    } catch (err) {
      console.error('[Middleware Auth Error]:', err);
      // En caso de error de conexión a la base de datos, dejamos pasar para no tirar un error 500,
      // pero las vistas se encargarán de manejar la falta de sesión.
      return redirect('/login');
    }
  }

  return next();
});
