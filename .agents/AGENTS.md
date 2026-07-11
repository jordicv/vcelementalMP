# Directrices para Agentes de IA — Benthic MP

Este repositorio utiliza una arquitectura de SaaS multi-tenant con Astro (SSR), Drizzle ORM (PostgreSQL) y BullMQ (Redis). 

Sigue estas directrices estrictamente para cualquier tarea de desarrollo o depuración:

---

## 🏛️ Directrices de Infraestructura y Conexión

1. **Variables de Entorno:**
   - La base de datos requiere la carga de variables de entorno de `.env` a través de `import 'dotenv/config'` al principio de `src/db/index.ts` tanto en la app de Astro como en scripts externos (migraciones, seed, etc.).
   
2. **Docker Compose:**
   - Postgres corre en puerto `5432` y Redis en `6379`. Antes de ejecutar cualquier consulta, asegúrate de levantar los servicios locales usando `docker compose up -d`.
   - Si ocurre un conflicto de autenticación (`auth_failed` / `28P01`), detén los contenedores de Docker, limpia los volúmenes persistidos y vuelve a levantarlos:
     ```bash
     docker compose down -v && docker compose up -d
     ```

3. **API de Mercado Público:**
   - La API de ChileCompra requiere obligatoriamente cabeceras de `User-Agent` simulando navegadores modernos (ej: Chrome) para evitar bloqueos por AWS WAF.
   - El parámetro `estado` de la API es sensible a mayúsculas/minúsculas y requiere su valor en minúsculas (ej: `estado=publicada`).
   - El formato de fecha requerido para consultas por día es `DDMMYYYY` (ej: `01072026`).

---

## 🛠️ Comandos Clave del Repositorio

- **Iniciar base de datos:** `docker compose up -d`
- **Recrear tablas:** `npm run db:push`
- **Sembrar datos iniciales:** `npm run db:seed`
- **Sincronización directa de prueba:** `npm run db:sync`
- **Workers asíncronos:** `npm run workers`
- **Arrancar Dev Server:** `npm run dev -- --port 4322`
