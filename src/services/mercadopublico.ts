// Cliente oficial para la API de Mercado Público (ChileCompra)
// Requiere cabecera User-Agent; de lo contrario devuelve error de conexión.

const BASE_URL = 'https://api.mercadopublico.cl/servicios/v1/publico';

export interface MPTender {
  CodigoExterno: string;
  Nombre: string;
  Estado: string;
  CodigoEstado?: number;
  MontoEstimado: number | null;
  Moneda?: string;
  FechaCierre: string | null;
  Descripcion?: string;
  Tipo?: string;        // LE, LP, LR, etc.
  // El endpoint de DETALLE (/licitaciones.json?codigo=...) devuelve 'Comprador'
  Comprador?: {
    CodigoOrganismo?: string;
    NombreOrganismo?: string;
    RutUnidad?: string;
    CodigoUnidad?: string;
    NombreUnidad?: string;
    DireccionUnidad?: string;
    ComunaUnidad?: string;   // ← CAMPO COMUNA
    RegionUnidad?: string;   // ← CAMPO REGIÓN (nombre completo)
    CodigoRegion?: string;
  };
  // El endpoint de LISTA (/licitaciones.json?fecha=...) devuelve 'Unidad' con menos campos
  Unidad?: {
    Nombre?: string;
    Region?: string;
    RegionCodigo?: string;
    Comuna?: string;
  };
  Fechas?: {
    FechaCreacion?: string;
    FechaCierre?: string;
    FechaPublicacion?: string;
    FechaAdjudicacion?: string;
  };
  [key: string]: unknown;
}

export interface MPResponse {
  Cantidad: number;
  FechaCreacion: string;
  Listado: MPTender[];
}

async function mpFetch(path: string, ticket: string): Promise<unknown> {
  const url = `${BASE_URL}${path}&ticket=${ticket}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`MP API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// Formatea una fecha como DDMMYYYY para la API de MercadoPublico
function formatDateDDMMYYYY(date: Date): string {
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year  = date.getFullYear();
  return `${day}${month}${year}`;
}

// Genera un arreglo de fechas de los últimos N días, más algunos días hábiles anteriores
function getRecentWorkDays(daysBack = 45): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i <= daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // Incluir lunes-viernes (0=Dom, 6=Sab)
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(d);
    }
  }
  return dates;
}

// Obtiene licitaciones del día actual
export async function getTodayTenders(ticket: string): Promise<MPTender[]> {
  const today = formatDateDDMMYYYY(new Date());
  console.log(`[MP Client] Consultando licitaciones para el día: ${today}`);
  let data = await mpFetch(`/licitaciones.json?fecha=${today}`, ticket) as MPResponse;

  // Si no hay resultados (ej: fin de semana/feriado), buscar el día hábil más reciente
  if (!data?.Listado || data.Listado.length === 0) {
    const workDays = getRecentWorkDays(10);
    for (const d of workDays.slice(1, 6)) { // Skip today, try last 5 work days
      const ds = formatDateDDMMYYYY(d);
      console.log(`[MP Client] Sin datos hoy. Probando ${ds}...`);
      data = await mpFetch(`/licitaciones.json?fecha=${ds}`, ticket) as MPResponse;
      if (data?.Listado && data.Listado.length > 0) break;
    }
  }

  return data?.Listado ?? [];
}

// Obtiene detalle de una licitación específica
export async function getTenderDetail(code: string, ticket: string): Promise<MPTender | null> {
  try {
    const data = await mpFetch(`/licitaciones.json?codigo=${code}`, ticket) as MPResponse;
    return data?.Listado?.[0] ?? null;
  } catch {
    return null;
  }
}

// Busca licitaciones por estado con paginación completa
export async function getTendersByStatus(
  status: 'Publicada' | 'Cerrada' | 'Adjudicada',
  ticket: string
): Promise<MPTender[]> {
  // La API usa códigos numéricos: 5=Publicada, 6=Cerrada, 8=Adjudicada
  const estadoCode: Record<string, number> = {
    'Publicada': 5, 'Cerrada': 6, 'Adjudicada': 8
  };
  const codigo = estadoCode[status] ?? 5;
  const allTenders: MPTender[] = [];
  const seenCodes = new Set<string>();

  try {
    let pagina = 1;
    while (allTenders.length < 500) {
      const data = await mpFetch(
        `/licitaciones.json?estado=${codigo}&pagina=${pagina}`, ticket
      ) as MPResponse;
      const list = data?.Listado ?? [];
      if (list.length === 0) break;
      for (const t of list) {
        if (t.CodigoExterno && !seenCodes.has(t.CodigoExterno)) {
          seenCodes.add(t.CodigoExterno);
          allTenders.push(t);
        }
      }
      console.log(`[MP Client] Estado ${status} pág.${pagina}: +${list.length} (total: ${allTenders.length})`);
      pagina++;
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (err: any) {
    console.warn('[MP Client] getTendersByStatus falló:', err.message);
  }

  if (allTenders.length > 0) return allTenders;

  // Fallback: buscar por fechas de los últimos 45 días laborales
  console.log('[MP Client] Estado vacío — usando fallback por fechas (45 días hábiles)...');
  return getTendersByDateRange(ticket, 45);
}

// Obtiene licitaciones de los últimos N días laborales, con paginación completa por día
export async function getTendersByDateRange(ticket: string, daysBack = 45): Promise<MPTender[]> {
  const allTenders: MPTender[] = [];
  const seenCodes = new Set<string>();
  const workDays = getRecentWorkDays(daysBack);

  for (const date of workDays) {
    const ds = formatDateDDMMYYYY(date);
    let dayTotal = 0;

    // Paginar dentro del mismo día (puede haber más de 1 página de resultados)
    let pagina = 1;
    while (true) {
      try {
        const data = await mpFetch(
          `/licitaciones.json?fecha=${ds}&pagina=${pagina}`, ticket
        ) as MPResponse;
        const list = data?.Listado ?? [];
        if (list.length === 0) break;

        for (const t of list) {
          if (t.CodigoExterno && !seenCodes.has(t.CodigoExterno)) {
            seenCodes.add(t.CodigoExterno);
            allTenders.push(t);
            dayTotal++;
          }
        }
        pagina++;
        await new Promise(r => setTimeout(r, 150));
      } catch (err: any) {
        console.warn(`[MP Client] Error en fecha ${ds} pág.${pagina}: ${err.message}`);
        break;
      }
    }

    if (dayTotal > 0) {
      console.log(`[MP Client] ${ds}: +${dayTotal} licitaciones (total acumulado: ${allTenders.length})`);
    }

    // Detener si ya tenemos suficientes para este ciclo de sync
    if (allTenders.length >= 500) break;
  }

  return allTenders;
}
