# Implementation Plan - No-Limit Budget Configuration

This plan updates the budget limits (`budgetMin` and `budgetMax`) in the company configuration. The limits will default to `0` (representing "no limit"), which skips operational budget penalties and awards the full score. The user can still set custom non-zero amounts to apply minimum and maximum budget scoring boundaries.

## User Review Required

> [!NOTE]
> Setting both `budgetMin` and `budgetMax` to `0` will disable budget limits, resulting in a maximum budget score of `20` ("Dentro de tu rango ideal") for all tenders with a declared budget. If a tender has no declared budget, it will still receive the standard default score of `10` ("Sin presupuesto declarado").

## Proposed Changes

---

### Database and Seed Data

#### [MODIFY] [schema.ts](file:///Users/teddy/Documents/Proyectos/benthic-mp/src/db/schema.ts)
- Update `budgetMin` and `budgetMax` columns on the `companies` table to have a default value of `'0'`.

#### [MODIFY] [seed.ts](file:///Users/teddy/Documents/Proyectos/benthic-mp/src/db/seed.ts)
- Update seed file defaults to insert `'0'` for `budgetMin` and `budgetMax` for new companies instead of `'10000000'` and `'50000000'`.

---

### Configuration Interface and Backend API

#### [MODIFY] [configuracion.astro](file:///Users/teddy/Documents/Proyectos/benthic-mp/src/pages/dashboard/configuracion.astro)
- Change Astro frontmatter fallback values for `budgetMin` and `budgetMax` to `'0'`.
- Set default input value properties to fallback to `'0'` (e.g., `value={company.budgetMin ?? '0'}`).
- Update UI helper descriptions to explicitly instruct the user to "Use 0 for no limit".

#### [MODIFY] [config.ts](file:///Users/teddy/Documents/Proyectos/benthic-mp/src/pages/api/company/config.ts)
- Fallback empty or missing inputs for `budgetMin` and `budgetMax` to `'0'` in the database save operation, preventing unexpected `null` value persistence.

---

### Scoring Engine

#### [MODIFY] [index.ts](file:///Users/teddy/Documents/Proyectos/benthic-mp/src/services/scoring/index.ts)
- Update `scoreBudget` to check if limits are non-zero.
- If both limits are `0` (or `null`), return score `20` with the label `'Dentro de tu rango ideal'` (or similar positive label).
- If only one of the limits is `0` (or `null`), bypass only that limit's checks/penalties:
  - If `budgetMin <= 0` or missing, skip minimum limit penalty checks.
  - If `budgetMax <= 0` or missing, skip maximum limit penalty checks.

---

## Verification Plan

### Automated Tests / Code Running
We will run:
- Database schema validation and generation commands: `npm run db:generate` / `npm run db:push`
- Re-run seed script: `npm run db:seed`
- Trigger the sync/recalculation: `npm run db:sync` or test with api calls.

### Manual Verification
- Navigate to the config page `/dashboard/configuracion` in the browser or check via API payloads.
- Verify that setting limits to `0` changes tender scores as expected.
