// Motor central de scoring — VC Elemental Intelligence Score
import { scoreRubro } from './rubro.scorer';
import { scoreRegion } from './region.scorer';
import type { InferSelectModel } from 'drizzle-orm';
import type { tenders, companies } from '../../db/schema';

type Tender  = InferSelectModel<typeof tenders>;
type Company = InferSelectModel<typeof companies>;

export interface ScoreResult {
  total:       number;  // 0-100
  rubro:       number;  // 0-40
  region:      number;  // 0-30
  budget:      number;  // 0-20
  urgency:     number;  // 0-10
  label:       string;  // "Muy Recomendada"
  rubroLabel:  string;
  regionLabel: string;
  budgetLabel: string;
  urgencyLabel: string;
}

function scoreBudget(tender: Tender, company: Company): { score: number; label: string } {
  if (!tender.budget) return { score: 10, label: 'Sin presupuesto declarado' };
  const budget = parseFloat(tender.budget as string);
  const min = company.budgetMin ? parseFloat(company.budgetMin as string) : 0;
  const max = company.budgetMax ? parseFloat(company.budgetMax as string) : 0;

  if (min === 0 && max === 0) return { score: 20, label: 'Dentro de tu rango ideal' };

  if (min > 0 && budget < min) return { score: 8, label: 'Bajo tu mínimo operacional' };
  if (max > 0 && budget > max * 1.5) return { score: 5, label: 'Muy por sobre tu rango' };
  if (max > 0 && budget > max) return { score: 12, label: 'Sobre tu rango (hasta 150%)' };
  return { score: 20, label: 'Dentro de tu rango ideal' };
}

function scoreUrgency(tender: Tender): { score: number; label: string } {
  if (!tender.closeDate) return { score: 5, label: 'Sin fecha de cierre' };
  const daysLeft = Math.floor((new Date(tender.closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0)  return { score: 0, label: 'Licitación cerrada' };
  if (daysLeft < 3)  return { score: 0, label: `${daysLeft}d — Inviable` };
  if (daysLeft < 7)  return { score: 3, label: `${daysLeft}d — Riesgo alto` };
  if (daysLeft < 15) return { score: 7, label: `${daysLeft}d — Plazo ajustado` };
  return { score: 10, label: `${daysLeft}d — Tiempo cómodo` };
}

function getLabel(total: number): string {
  if (total >= 80) return 'Muy Recomendada';
  if (total >= 60) return 'Recomendada';
  if (total >= 40) return 'Evaluar';
  return 'Poco Recomendada';
}

export function calculateScore(tender: Tender, company: Company): ScoreResult {
  const rubroResult   = scoreRubro(tender.title, null, company.industry);
  const regionResult  = scoreRegion(tender.buyerRegion, company.region);
  const budgetResult  = scoreBudget(tender, company);
  const urgencyResult = scoreUrgency(tender);

  const total = rubroResult.score + regionResult.score + budgetResult.score + urgencyResult.score;

  return {
    total,
    rubro:        rubroResult.score,
    region:       regionResult.score,
    budget:       budgetResult.score,
    urgency:      urgencyResult.score,
    label:        getLabel(total),
    rubroLabel:   rubroResult.label,
    regionLabel:  regionResult.label,
    budgetLabel:  budgetResult.label,
    urgencyLabel: urgencyResult.label,
  };
}
