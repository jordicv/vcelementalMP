import {
  pgTable, uuid, text, timestamp, boolean, integer,
  numeric, jsonb, pgEnum, uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enumeraciones ────────────────────────────────────────────────
export const planTypeEnum   = pgEnum('plan_type',    ['starter', 'growth', 'enterprise']);
export const userRoleEnum   = pgEnum('user_role',    ['owner', 'admin', 'analyst', 'viewer']);
export const alertChannelEnum = pgEnum('alert_channel', ['email', 'whatsapp']);

// ─── Empresas (Tenants) ───────────────────────────────────────────
export const companies = pgTable('companies', {
  id:         uuid('id').primaryKey().defaultRandom(),
  name:       text('name').notNull(),
  rut:        text('rut').unique().notNull(),
  industry:   text('industry'),            // Rubro: "Tecnología", "Construcción"...
  region:     text('region'),              // Región principal: "RM", "V"...
  apiTicket:  text('api_ticket'),          // Ticket personal de Mercado Público
  // Rango presupuestal operacional (en CLP)
  budgetMin:  numeric('budget_min').default('0'),
  budgetMax:  numeric('budget_max').default('0'),
  // Plan de suscripción
  plan:       planTypeEnum('plan').notNull().default('starter'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  isActive:   boolean('is_active').notNull().default(true),
  createdAt:  timestamp('created_at').defaultNow(),
});

// ─── Usuarios ─────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:         uuid('id').primaryKey().defaultRandom(),
  companyId:  uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  email:      text('email').unique().notNull(),
  name:       text('name').notNull(),
  phone:      text('phone'),               // Para alertas WhatsApp: +56912345678
  role:       userRoleEnum('role').notNull().default('viewer'),
  isActive:   boolean('is_active').notNull().default(true),
  lastLogin:  timestamp('last_login'),
  createdAt:  timestamp('created_at').defaultNow(),
});

// ─── Licitaciones cacheadas por empresa ───────────────────────────
export const tenders = pgTable('tenders', {
  id:           uuid('id').primaryKey().defaultRandom(),
  companyId:    uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  // Datos de la API de Mercado Público
  externalCode: text('external_code').notNull(),    // "1067476-19-LE26"
  title:        text('title').notNull(),
  status:       text('status'),                      // Publicada, Cerrada, Adjudicada
  budget:       numeric('budget'),                   // Monto original
  currency:     text('currency').default('CLP'),     // Moneda: CLP, UTM, UF, USD
  closeDate:    timestamp('close_date'),
  buyerName:    text('buyer_name'),                 // Nombre organismo comprador
  buyerRegion:  text('buyer_region'),               // "Región Metropolitana"
  buyerRegionCode: text('buyer_region_code'),       // "RM"
  buyerCommune: text('buyer_commune'),              // "Santiago", "Valparaíso"...
  rawData:      jsonb('raw_data'),                  // Payload completo de la API
  // IA y Scoring
  aiSummary:    text('ai_summary'),                 // Resumen generado por Gemini
  scoreTotalVal: integer('score_total').default(0), // 0-100
  scoreRubro:   integer('score_rubro').default(0),  // 0-40
  scoreRegion:  integer('score_region').default(0), // 0-30
  scoreBudget:  integer('score_budget').default(0), // 0-20
  scoreUrgency: integer('score_urgency').default(0),// 0-10
  scoreLabel:   text('score_label'),               // "Muy Recomendada"
  scoredAt:     timestamp('scored_at'),
  createdAt:    timestamp('created_at').defaultNow(),
}, (t) => ({
  uniqueTender: uniqueIndex('unique_tender_per_company').on(t.companyId, t.externalCode),
}));

// ─── Alertas configuradas por usuario ─────────────────────────────
export const alerts = pgTable('alerts', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  companyId:   uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  channel:     alertChannelEnum('channel').notNull(),
  // Tipos de trigger: 'new_tender', 'closing_soon', 'adjudicated', 'score_match'
  triggerType: text('trigger_type').notNull(),
  // Filtros en JSON: { keywords: ["web"], minBudget: 5000000, minScore: 70, regions: ["RM","V"] }
  filters:     jsonb('filters'),
  isActive:    boolean('is_active').default(true),
  createdAt:   timestamp('created_at').defaultNow(),
});

// ─── Log de notificaciones enviadas ───────────────────────────────
export const notificationLog = pgTable('notification_log', {
  id:       uuid('id').primaryKey().defaultRandom(),
  alertId:  uuid('alert_id').references(() => alerts.id),
  tenderId: uuid('tender_id').references(() => tenders.id),
  channel:  text('channel'),
  status:   text('status'), // 'sent', 'failed', 'rate_limited'
  sentAt:   timestamp('sent_at').defaultNow(),
});

// ─── Relaciones ───────────────────────────────────────────────────
export const companiesRelations = relations(companies, ({ many }) => ({
  users:   many(users),
  tenders: many(tenders),
  alerts:  many(alerts),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  alerts:  many(alerts),
}));

export const tendersRelations = relations(tenders, ({ one }) => ({
  company: one(companies, { fields: [tenders.companyId], references: [companies.id] }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user:    one(users,     { fields: [alerts.userId],    references: [users.id] }),
  company: one(companies, { fields: [alerts.companyId], references: [companies.id] }),
}));
