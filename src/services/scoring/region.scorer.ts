// Motor de Score de Región (0-30 puntos)
// Ponderación: 30% del score total

type RegionMeta = { zone: string; neighbors: string[] };

export const CHILE_REGIONS: Record<string, RegionMeta> = {
  'I':    { zone: 'norte-grande',  neighbors: ['XV', 'II'] },
  'II':   { zone: 'norte-grande',  neighbors: ['I', 'III', 'XV'] },
  'III':  { zone: 'norte-chico',   neighbors: ['II', 'IV'] },
  'IV':   { zone: 'norte-chico',   neighbors: ['III', 'V', 'RM'] },
  'V':    { zone: 'centro',        neighbors: ['RM', 'IV', 'VI'] },
  'RM':   { zone: 'centro',        neighbors: ['V', 'VI', 'VII'] },
  'VI':   { zone: 'centro',        neighbors: ['RM', 'V', 'VII'] },
  'VII':  { zone: 'centro-sur',    neighbors: ['VI', 'RM', 'VIII', 'XVI'] },
  'XVI':  { zone: 'centro-sur',    neighbors: ['VII', 'VIII', 'IX'] },
  'VIII': { zone: 'centro-sur',    neighbors: ['VII', 'XVI', 'IX', 'XIV'] },
  'IX':   { zone: 'sur',           neighbors: ['VIII', 'XVI', 'XIV', 'X'] },
  'XIV':  { zone: 'sur',           neighbors: ['IX', 'X'] },
  'X':    { zone: 'sur',           neighbors: ['XIV', 'IX', 'XI'] },
  'XI':   { zone: 'austral',       neighbors: ['X', 'XII'] },
  'XII':  { zone: 'austral',       neighbors: ['XI'] },
  'XV':   { zone: 'norte-grande',  neighbors: ['I', 'II'] },
};

// Normaliza textos de región que vienen de la API a código
export function extractRegionCode(regionText: string | null | undefined): string | null {
  if (!regionText) return null;
  const t = regionText.toLowerCase().trim();
  if (t.includes('metropolitana') || t.includes(' rm') || t.includes('santiago')) return 'RM';
  if (t.includes('valparaíso') || t.includes('valparaiso')) return 'V';
  if (t.includes('o\'higgins') || t.includes("o'higgins") || t.includes('libertador')) return 'VI';
  if (t.includes('maule')) return 'VII';
  if (t.includes('ñuble')) return 'XVI';
  if (t.includes('biobío') || t.includes('biobio') || t.includes('bío-bío')) return 'VIII';
  if (t.includes('araucanía') || t.includes('araucania')) return 'IX';
  if (t.includes('los ríos') || t.includes('los rios')) return 'XIV';
  if (t.includes('los lagos')) return 'X';
  if (t.includes('aysén') || t.includes('aysen')) return 'XI';
  if (t.includes('magallanes')) return 'XII';
  if (t.includes('coquimbo')) return 'IV';
  if (t.includes('atacama')) return 'III';
  if (t.includes('antofagasta')) return 'II';
  if (t.includes('tarapacá') || t.includes('tarapaca')) return 'I';
  if (t.includes('arica')) return 'XV';
  if (t.includes('nacional') || t.includes('todo el país') || t.includes('todo el pais')) return 'NACIONAL';
  return null;
}

export function scoreRegion(
  tenderRegionText: string | null | undefined,
  companyRegion: string | null | undefined
): { score: number; label: string } {
  if (!companyRegion) return { score: 15, label: 'Región no configurada' };

  if (companyRegion === 'Sin región específica') {
    return { score: 30, label: 'Cobertura nacional (Sin región específica)' };
  }

  const tenderCode = extractRegionCode(tenderRegionText);

  if (!tenderCode || tenderCode === 'NACIONAL') {
    return { score: 30, label: 'Licitación nacional (Cobertura completa)' };
  }
  if (tenderCode === companyRegion) {
    return { score: 30, label: `Misma región (${companyRegion})` };
  }
  if (CHILE_REGIONS[companyRegion]?.neighbors.includes(tenderCode)) {
    return { score: 20, label: `Región limítrofe (${tenderCode})` };
  }
  if (CHILE_REGIONS[companyRegion]?.zone === CHILE_REGIONS[tenderCode]?.zone) {
    return { score: 12, label: `Misma macrozona` };
  }
  return { score: 0, label: `Región lejana (${tenderCode})` };
}
