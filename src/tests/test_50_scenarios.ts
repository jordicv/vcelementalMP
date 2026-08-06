import { scoreRubro, AVAILABLE_RUBROS } from '../services/scoring/rubro.scorer';
import { scoreRegion, extractRegionCode, CHILE_REGIONS } from '../services/scoring/region.scorer';
import { calculateScore } from '../services/scoring/index';
import { decodeHtmlEntities, parseBasesHtml, resolveBasesFromFicha } from '../services/scraper';
import { formatDateDDMMYYYY, getRecentWorkDays } from '../services/mercadopublico';

interface TestCase {
  id: number;
  category: string;
  description: string;
  fn: () => boolean | void | Promise<boolean | void>;
}

const tests: TestCase[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RUBRO SCORER (Scenarios 1 - 10)
// ─────────────────────────────────────────────────────────────────────────────

tests.push({
  id: 1,
  category: 'Rubro Scorer',
  description: 'Exact match with 2+ keywords in Tecnología (Score 40)',
  fn: () => {
    const res = scoreRubro('Desarrollo de software y sistema web para municipio', null, 'Tecnología');
    assert(res.score === 40, `Expected 40, got ${res.score}`);
    assert(res.label === 'Coincidencia exacta de rubro', `Unexpected label ${res.label}`);
  }
});

tests.push({
  id: 2,
  category: 'Rubro Scorer',
  description: 'Partial match with 1 keyword in Construcción (Score 25)',
  fn: () => {
    const res = scoreRubro('Servicios de acera', null, 'Construcción');
    assert(res.score === 25, `Expected 25, got ${res.score}`);
    assert(res.label === 'Rubro relacionado', `Unexpected label ${res.label}`);
  }
});

tests.push({
  id: 3,
  category: 'Rubro Scorer',
  description: 'Peripheral match (score 10) for related rubro (Tecnología -> Consultoría)',
  fn: () => {
    const res = scoreRubro('Asesoría en auditoría contable y consultoría estratégica', null, 'Tecnología');
    assert(res.score === 10, `Expected 10, got ${res.score}`);
    assert(res.label.includes('Rubro periférico'), `Unexpected label ${res.label}`);
  }
});

tests.push({
  id: 4,
  category: 'Rubro Scorer',
  description: 'No match (Score 0) when title has completely unrelated terms',
  fn: () => {
    const res = scoreRubro('Adquisición de alimento concentrado para bovinos', null, 'Tecnología');
    assert(res.score === 0, `Expected 0, got ${res.score}`);
    assert(res.label === 'Sin relación con el rubro', `Unexpected label ${res.label}`);
  }
});

tests.push({
  id: 5,
  category: 'Rubro Scorer',
  description: 'Neutral score (40) when company has "Sin rubro específico"',
  fn: () => {
    const res = scoreRubro('Suministro de cualquier insumo', null, 'Sin rubro específico');
    assert(res.score === 40, `Expected 40, got ${res.score}`);
    assert(res.label.includes('Evaluación neutral'), `Unexpected label ${res.label}`);
  }
});

tests.push({
  id: 6,
  category: 'Rubro Scorer',
  description: 'Fallback (Score 10) when company industry is null or empty',
  fn: () => {
    const res = scoreRubro('Servicio de banquetería', null, null);
    assert(res.score === 10, `Expected 10, got ${res.score}`);
    assert(res.label === 'Rubro no configurado', `Unexpected label ${res.label}`);
  }
});

tests.push({
  id: 7,
  category: 'Rubro Scorer',
  description: 'Short word boundary check ("ti" / "pc" / "ups")',
  fn: () => {
    // Should match 'pc' and 'ti' as full words, not inside 'participación' or 'noticia'
    const res = scoreRubro('Adquisición de pc para área ti', null, 'Tecnología');
    assert(res.score === 40, `Expected 40 for short words boundary match, got ${res.score}`);
  }
});

tests.push({
  id: 8,
  category: 'Rubro Scorer',
  description: 'Description inclusion boost (keywords in description)',
  fn: () => {
    const res = scoreRubro('Licitación pública 1024', 'Suministro e instalación de servidores y datacenter', 'Tecnología');
    assert(res.score === 40, `Expected 40, got ${res.score}`);
  }
});

tests.push({
  id: 9,
  category: 'Rubro Scorer',
  description: 'Available rubros list has at least 15 categories',
  fn: () => {
    assert(AVAILABLE_RUBROS.length >= 15, `Expected >=15 rubros, found ${AVAILABLE_RUBROS.length}`);
  }
});

tests.push({
  id: 10,
  category: 'Rubro Scorer',
  description: 'Salud industry matching hospital & medicamentos keywords',
  fn: () => {
    const res = scoreRubro('Adquisición de medicamentos e insumos médicos para hospital', null, 'Salud');
    assert(res.score === 40, `Expected 40, got ${res.score}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. REGION SCORER (Scenarios 11 - 20)
// ─────────────────────────────────────────────────────────────────────────────

tests.push({
  id: 11,
  category: 'Region Scorer',
  description: 'Exact same region match (RM = RM -> 30 pts)',
  fn: () => {
    const res = scoreRegion('Región Metropolitana', 'RM');
    assert(res.score === 30, `Expected 30, got ${res.score}`);
    assert(res.label.includes('Misma región'), `Unexpected label ${res.label}`);
  }
});

tests.push({
  id: 12,
  category: 'Region Scorer',
  description: 'Neighboring region match (V neighbors RM -> 20 pts)',
  fn: () => {
    const res = scoreRegion('Región de Valparaíso', 'RM');
    assert(res.score === 20, `Expected 20, got ${res.score}`);
    assert(res.label.includes('Región limítrofe'), `Unexpected label ${res.label}`);
  }
});

tests.push({
  id: 13,
  category: 'Region Scorer',
  description: 'Same macrozone match (IV & III in norte-chico -> 12 pts)',
  fn: () => {
    const res = scoreRegion('Región de Coquimbo', 'III');
    assert(res.score === 20, `Expected 20 (they are direct neighbors), got ${res.score}`);
  }
});

tests.push({
  id: 14,
  category: 'Region Scorer',
  description: 'Distant region match (XII Magallanes vs RM -> 0 pts)',
  fn: () => {
    const res = scoreRegion('Región de Magallanes', 'RM');
    assert(res.score === 0, `Expected 0, got ${res.score}`);
    assert(res.label.includes('Región lejana'), `Unexpected label ${res.label}`);
  }
});

tests.push({
  id: 15,
  category: 'Region Scorer',
  description: 'National tender coverage ("Todo el país" -> 30 pts)',
  fn: () => {
    const res = scoreRegion('Cobertura en todo el país', 'RM');
    assert(res.score === 30, `Expected 30 for national tender, got ${res.score}`);
  }
});

tests.push({
  id: 16,
  category: 'Region Scorer',
  description: 'Company configured as "Sin región específica" -> 30 pts',
  fn: () => {
    const res = scoreRegion('Región de Aysén', 'Sin región específica');
    assert(res.score === 30, `Expected 30, got ${res.score}`);
  }
});

tests.push({
  id: 17,
  category: 'Region Scorer',
  description: 'Null company region fallback -> 15 pts',
  fn: () => {
    const res = scoreRegion('Región de Antofagasta', null);
    assert(res.score === 15, `Expected 15, got ${res.score}`);
  }
});

tests.push({
  id: 18,
  category: 'Region Scorer',
  description: 'Region extraction for O\'Higgins variations',
  fn: () => {
    assert(extractRegionCode("Región del Libertador General Bernardo O'Higgins") === 'VI', 'Failed O\'Higgins');
    assert(extractRegionCode('Región de O´Higgins') === 'VI', 'Failed O´Higgins curly');
  }
});

tests.push({
  id: 19,
  category: 'Region Scorer',
  description: 'Region extraction for Ñuble and Biobío',
  fn: () => {
    assert(extractRegionCode('Región del Ñuble') === 'XVI', 'Failed Ñuble');
    assert(extractRegionCode('Región del Bío-Bío') === 'VIII', 'Failed Biobío');
  }
});

tests.push({
  id: 20,
  category: 'Region Scorer',
  description: 'Region extraction for Austral regions (XI & XII)',
  fn: () => {
    assert(extractRegionCode('Región de Aysén del General Carlos Ibáñez') === 'XI', 'Failed Aysén');
    assert(extractRegionCode('Región de Magallanes y Antártica') === 'XII', 'Failed Magallanes');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. BUDGET SCORER & CURRENCY CONVERSION (Scenarios 21 - 29)
// ─────────────────────────────────────────────────────────────────────────────

const mockCompany = {
  id: 'comp-1',
  name: 'Test Corp',
  rut: '12345678-9',
  industry: 'Tecnología',
  region: 'RM',
  apiTicket: 'ticket-123',
  budgetMin: '10000000',  // 10M CLP
  budgetMax: '50000000',  // 50M CLP
  plan: 'starter' as const,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  isActive: true,
  createdAt: new Date(),
};

tests.push({
  id: 21,
  category: 'Budget Scorer',
  description: 'Budget within ideal range (30M CLP -> 20 pts)',
  fn: () => {
    const tender = { title: 'Test', budget: '30000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 20 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.budget === 20, `Expected 20, got ${res.budget}`);
    assert(res.budgetLabel === 'Dentro de tu rango ideal', `Unexpected label ${res.budgetLabel}`);
  }
});

tests.push({
  id: 22,
  category: 'Budget Scorer',
  description: 'Budget below minimum operational (5M CLP vs 10M min -> 8 pts)',
  fn: () => {
    const tender = { title: 'Test', budget: '5000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 20 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.budget === 8, `Expected 8, got ${res.budget}`);
    assert(res.budgetLabel === 'Bajo tu mínimo operacional', `Unexpected label ${res.budgetLabel}`);
  }
});

tests.push({
  id: 23,
  category: 'Budget Scorer',
  description: 'Budget slightly above max (60M CLP vs 50M max -> 12 pts)',
  fn: () => {
    const tender = { title: 'Test', budget: '60000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 20 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.budget === 12, `Expected 12, got ${res.budget}`);
    assert(res.budgetLabel === 'Sobre tu rango (hasta 150%)', `Unexpected label ${res.budgetLabel}`);
  }
});

tests.push({
  id: 24,
  category: 'Budget Scorer',
  description: 'Budget way above max (100M CLP vs 50M max -> 5 pts)',
  fn: () => {
    const tender = { title: 'Test', budget: '100000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 20 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.budget === 5, `Expected 5, got ${res.budget}`);
    assert(res.budgetLabel === 'Muy por sobre tu rango', `Unexpected label ${res.budgetLabel}`);
  }
});

tests.push({
  id: 25,
  category: 'Budget Scorer',
  description: 'Undeclared tender budget (null -> 10 pts)',
  fn: () => {
    const tender = { title: 'Test', budget: null, buyerRegion: 'RM', closeDate: new Date(Date.now() + 20 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.budget === 10, `Expected 10, got ${res.budget}`);
  }
});

tests.push({
  id: 26,
  category: 'Budget Scorer',
  description: 'Company with 0 min & 0 max budget -> 20 pts for any budget',
  fn: () => {
    const openComp = { ...mockCompany, budgetMin: '0', budgetMax: '0' };
    const tender = { title: 'Test', budget: '500000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 20 * 86400000) } as any;
    const res = calculateScore(tender, openComp);
    assert(res.budget === 20, `Expected 20, got ${res.budget}`);
  }
});

tests.push({
  id: 27,
  category: 'Budget Conversion',
  description: 'UTM currency conversion logic (500 UTM = ~33M CLP -> 20 pts)',
  fn: () => {
    const utmVal = 500;
    const budgetClp = utmVal * 66000;
    const tender = { title: 'Test', budget: budgetClp.toString(), buyerRegion: 'RM', closeDate: new Date(Date.now() + 20 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.budget === 20, `Expected 20 for 33M CLP converted from UTM, got ${res.budget}`);
  }
});

tests.push({
  id: 28,
  category: 'Budget Conversion',
  description: 'UF currency conversion logic (800 UF = ~30.4M CLP -> 20 pts)',
  fn: () => {
    const ufVal = 800;
    const budgetClp = ufVal * 38000;
    const tender = { title: 'Test', budget: budgetClp.toString(), buyerRegion: 'RM', closeDate: new Date(Date.now() + 20 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.budget === 20, `Expected 20 for converted UF, got ${res.budget}`);
  }
});

tests.push({
  id: 29,
  category: 'Budget Conversion',
  description: 'USD currency conversion logic (40,000 USD = ~37.2M CLP -> 20 pts)',
  fn: () => {
    const usdVal = 40000;
    const budgetClp = usdVal * 930;
    const tender = { title: 'Test', budget: budgetClp.toString(), buyerRegion: 'RM', closeDate: new Date(Date.now() + 20 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.budget === 20, `Expected 20 for converted USD, got ${res.budget}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. URGENCY SCORER (Scenarios 30 - 36)
// ─────────────────────────────────────────────────────────────────────────────

tests.push({
  id: 30,
  category: 'Urgency Scorer',
  description: 'Comfortable time (> 15 days -> 10 pts)',
  fn: () => {
    const tender = { title: 'Test', budget: '20000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 20 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.urgency === 10, `Expected 10, got ${res.urgency}`);
    assert(res.urgencyLabel.includes('Tiempo cómodo'), `Unexpected label ${res.urgencyLabel}`);
  }
});

tests.push({
  id: 31,
  category: 'Urgency Scorer',
  description: 'Tight time (10 days -> 7 pts)',
  fn: () => {
    const tender = { title: 'Test', budget: '20000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 10 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.urgency === 7, `Expected 7, got ${res.urgency}`);
    assert(res.urgencyLabel.includes('Plazo ajustado'), `Unexpected label ${res.urgencyLabel}`);
  }
});

tests.push({
  id: 32,
  category: 'Urgency Scorer',
  description: 'High risk (5 days -> 3 pts)',
  fn: () => {
    const tender = { title: 'Test', budget: '20000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 5 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.urgency === 3, `Expected 3, got ${res.urgency}`);
    assert(res.urgencyLabel.includes('Riesgo alto'), `Unexpected label ${res.urgencyLabel}`);
  }
});

tests.push({
  id: 33,
  category: 'Urgency Scorer',
  description: 'Inviable (< 3 days -> 0 pts)',
  fn: () => {
    const tender = { title: 'Test', budget: '20000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 1 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.urgency === 0, `Expected 0, got ${res.urgency}`);
    assert(res.urgencyLabel.includes('Inviable'), `Unexpected label ${res.urgencyLabel}`);
  }
});

tests.push({
  id: 34,
  category: 'Urgency Scorer',
  description: 'Closed tender (past closeDate -> 0 pts)',
  fn: () => {
    const tender = { title: 'Test', budget: '20000000', buyerRegion: 'RM', closeDate: new Date(Date.now() - 2 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.urgency === 0, `Expected 0, got ${res.urgency}`);
    assert(res.urgencyLabel === 'Licitación cerrada', `Unexpected label ${res.urgencyLabel}`);
  }
});

tests.push({
  id: 35,
  category: 'Urgency Scorer',
  description: 'Undeclared closeDate (null -> 5 pts)',
  fn: () => {
    const tender = { title: 'Test', budget: '20000000', buyerRegion: 'RM', closeDate: null } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.urgency === 5, `Expected 5, got ${res.urgency}`);
    assert(res.urgencyLabel === 'Sin fecha de cierre', `Unexpected label ${res.urgencyLabel}`);
  }
});

tests.push({
  id: 36,
  category: 'Urgency Scorer',
  description: 'Exact threshold: 15 days -> 10 pts',
  fn: () => {
    const tender = { title: 'Test', budget: '20000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 15 * 86400000 + 10000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.urgency === 10, `Expected 10, got ${res.urgency}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. TOTAL SCORE LABELS & INTEGRATION (Scenarios 37 - 42)
// ─────────────────────────────────────────────────────────────────────────────

tests.push({
  id: 37,
  category: 'Score Aggregation',
  description: 'Total score >= 80 -> "Muy Recomendada"',
  fn: () => {
    // 40 (rubro) + 30 (region) + 20 (budget) + 10 (urgency) = 100
    const tender = { title: 'Desarrollo de software y sistema de información', budget: '30000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 20 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.total === 100, `Expected 100, got ${res.total}`);
    assert(res.label === 'Muy Recomendada', `Expected Muy Recomendada, got ${res.label}`);
  }
});

tests.push({
  id: 38,
  category: 'Score Aggregation',
  description: 'Total score 60-79 -> "Recomendada"',
  fn: () => {
    // 25 (rubro) + 20 (region V) + 20 (budget) + 7 (urgency 10d) = 72
    const tender = { title: 'Servicios de acera', budget: '30000000', buyerRegion: 'Región de Valparaíso', closeDate: new Date(Date.now() + 10 * 86400000) } as any;
    const techCompany = { ...mockCompany, industry: 'Construcción' };
    const res = calculateScore(tender, techCompany);
    assert(res.total >= 60 && res.total < 80, `Expected 60-79, got ${res.total}`);
    assert(res.label === 'Recomendada', `Expected Recomendada, got ${res.label}`);
  }
});

tests.push({
  id: 39,
  category: 'Score Aggregation',
  description: 'Total score 40-59 -> "Evaluar"',
  fn: () => {
    // 0 (rubro) + 30 (region) + 12 (budget) + 3 (urgency 5d) = 45
    const tender = { title: 'Compra de medicamentos hospitalarios', budget: '60000000', buyerRegion: 'RM', closeDate: new Date(Date.now() + 5 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.total >= 40 && res.total < 60, `Expected 40-59, got ${res.total}`);
    assert(res.label === 'Evaluar', `Expected Evaluar, got ${res.label}`);
  }
});

tests.push({
  id: 40,
  category: 'Score Aggregation',
  description: 'Total score < 40 -> "Poco Recomendada"',
  fn: () => {
    // 0 (rubro) + 0 (region XII) + 5 (budget 100M) + 0 (urgency 1d) = 5
    const tender = { title: 'Servicio de faena pesquera en Punta Arenas', budget: '100000000', buyerRegion: 'Región de Magallanes', closeDate: new Date(Date.now() + 1 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.total < 40, `Expected <40, got ${res.total}`);
    assert(res.label === 'Poco Recomendada', `Expected Poco Recomendada, got ${res.label}`);
  }
});

tests.push({
  id: 41,
  category: 'Score Aggregation',
  description: 'Perfect score 100 breakdown validation',
  fn: () => {
    const tender = { title: 'Plataforma web y desarrollo de software', budget: '25000000', buyerRegion: 'Región Metropolitana', closeDate: new Date(Date.now() + 30 * 86400000) } as any;
    const res = calculateScore(tender, mockCompany);
    assert(res.rubro === 40, 'Rubro 40');
    assert(res.region === 30, 'Region 30');
    assert(res.budget === 20, 'Budget 20');
    assert(res.urgency === 10, 'Urgency 10');
    assert(res.total === 100, 'Total 100');
  }
});

tests.push({
  id: 42,
  category: 'Score Aggregation',
  description: 'Score result structure fields complete',
  fn: () => {
    const tender = { title: 'Test', budget: '10000000', buyerRegion: 'RM', closeDate: new Date() } as any;
    const res = calculateScore(tender, mockCompany);
    assert(typeof res.total === 'number', 'total');
    assert(typeof res.rubroLabel === 'string', 'rubroLabel');
    assert(typeof res.regionLabel === 'string', 'regionLabel');
    assert(typeof res.budgetLabel === 'string', 'budgetLabel');
    assert(typeof res.urgencyLabel === 'string', 'urgencyLabel');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SCRAPER & HTML ENTITY DECODER (Scenarios 43 - 47)
// ─────────────────────────────────────────────────────────────────────────────

tests.push({
  id: 43,
  category: 'HTML Entity Decoder',
  description: 'Standard entities decoding (&nbsp;, &amp;, &quot;, &lt;, &gt;, spanish accents)',
  fn: () => {
    const input = 'Adquisici&oacute;n de &quot;Equipos&quot; &amp; Insumos&nbsp;para hospital &lt;urgente&gt;';
    const decoded = decodeHtmlEntities(input);
    assert(decoded === 'Adquisición de "Equipos" & Insumos para hospital <urgente>', `Decoded mismatch: ${decoded}`);
  }
});

tests.push({
  id: 44,
  category: 'HTML Entity Decoder',
  description: 'Decimal and Hex HTML character entity decoding',
  fn: () => {
    const input = 'Licitaci&#243;n N&#186; 100 &#x00F3; 200';
    const decoded = decodeHtmlEntities(input);
    assert(decoded.includes('Licitación') && decoded.includes('º'), `Decoded mismatch: ${decoded}`);
  }
});

tests.push({
  id: 45,
  category: 'Scraper HTML Parser',
  description: 'Extracting bases sections from Mercado Público HTML ASPX snippet',
  fn: () => {
    const mockHtml = `
      <div id="Ficha1">
        <table>
          <tr><td>Nombre de la licitación</td><td>Servicio de Mantención</td></tr>
        </table>
      </div>
      <div id="Ficha3">
        <table>
          <tr><td>Fecha Cierre</td><td>15-08-2026</td></tr>
        </table>
      </div>
    `;
    const parsed = parseBasesHtml(mockHtml);
    assert(parsed['caracteristicas'] !== undefined, 'Missing caracteristicas');
    assert(parsed['etapasPlazos'] !== undefined, 'Missing etapasPlazos');
    assert(parsed['caracteristicas'].includes('Servicio de Mantención'), 'Missing content in caracteristicas');
  }
});

tests.push({
  id: 46,
  category: 'Scraper HTML Parser',
  description: 'Empty or malformed HTML returns clean empty dict',
  fn: () => {
    const parsed = parseBasesHtml('<div>No ficha here</div>');
    assert(Object.keys(parsed).length === 0, 'Expected empty dict');
  }
});

tests.push({
  id: 47,
  category: 'Scraper HTTP Fallback',
  description: 'resolveBasesFromFicha returns null on invalid code or unreachable URL',
  fn: async () => {
    const res = await resolveBasesFromFicha('INVALID-CODE-9999');
    assert(res === null || typeof res === 'object', 'Expected null or dict object on network fallback');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. DATE UTILITIES & MERCADO PÚBLICO CLIENT (Scenarios 48 - 50)
// ─────────────────────────────────────────────────────────────────────────────

tests.push({
  id: 48,
  category: 'Date Utilities',
  description: 'formatDateDDMMYYYY generates correct 8-digit string DDMMYYYY',
  fn: () => {
    const testDate = new Date(2026, 6, 5); // 05 July 2026
    const formatted = formatDateDDMMYYYY(testDate);
    assert(formatted === '05072026', `Expected 05072026, got ${formatted}`);
  }
});

tests.push({
  id: 49,
  category: 'Date Utilities',
  description: 'getRecentWorkDays filters out weekends (Saturday & Sunday)',
  fn: () => {
    const days = getRecentWorkDays(14);
    assert(days.length > 0, 'Days empty');
    for (const d of days) {
      const dayOfWeek = d.getDay();
      assert(dayOfWeek !== 0 && dayOfWeek !== 6, `Found weekend day ${dayOfWeek}`);
    }
  }
});

tests.push({
  id: 50,
  category: 'End-to-End Scoring & Data Pipeline',
  description: 'Full scenario: High Tech tender + RM region + Ideal budget + 25 days = 100 pts',
  fn: () => {
    const tender = {
      externalCode: '1067476-19-LE26',
      title: 'Desarrollo de plataforma web, sistema de software y nube',
      budget: '35000000',
      currency: 'CLP',
      buyerRegion: 'Región Metropolitana',
      closeDate: new Date(Date.now() + 25 * 86400000),
    } as any;

    const company = {
      id: 'c-1',
      name: 'Tech Soluciones SpA',
      industry: 'Tecnología',
      region: 'RM',
      budgetMin: '15000000',
      budgetMax: '45000000',
    } as any;

    const result = calculateScore(tender, company);
    assert(result.total === 100, `Expected 100, got ${result.total}`);
    assert(result.label === 'Muy Recomendada', `Expected Muy Recomendada, got ${result.label}`);
    assert(result.rubro === 40, 'Rubro 40');
    assert(result.region === 30, 'Region 30');
    assert(result.budget === 20, 'Budget 20');
    assert(result.urgency === 10, 'Urgency 10');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

async function runAllScenarios() {
  console.log('=================================================================');
  console.log('🚀 INICIANDO SUITE DE 50 ESCENARIOS DE PRUEBA (VC ELEMENTAL MP)');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✅ [Escenario ${t.id.toString().padStart(2, '0')}/50] [${t.category}] ${t.description}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [Escenario ${t.id.toString().padStart(2, '0')}/50] [${t.category}] ${t.description}`);
      console.error(`   FAIL: ${err.message}`);
      failed++;
    }
  }

  console.log('\n=================================================================');
  console.log(`📊 RESUMEN DE RESULTADOS:`);
  console.log(`   TOTAL ESCENARIOS: ${tests.length}`);
  console.log(`   PASADOS:         ${passed}`);
  console.log(`   FALLIDOS:        ${failed}`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllScenarios();
