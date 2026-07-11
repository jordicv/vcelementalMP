# Tasks

- `[x] Modify database schema (src/db/schema.ts) to default budget columns to '0'`
- `[x] Generate and apply database changes (db:push)`
- `[x] Update seed data (src/db/seed.ts) to default company budgets to '0'`
- `[x] Re-run seed script (npm run db:seed) to reset active company configuration`
- `[x] Modify dashboard configuration page (src/pages/dashboard/configuracion.astro) frontmatter and input values`
- `[x] Modify configuration API (src/pages/api/company/config.ts) to save empty/missing inputs as '0'`
- `[x] Modify budget scoring logic (src/services/scoring/index.ts) to bypass checks when limits are 0`
- `[x] Run manual/automated checks to verify scoring recalculation and display`
- `[x] Create GitHub repository and push codebase to main branch`
