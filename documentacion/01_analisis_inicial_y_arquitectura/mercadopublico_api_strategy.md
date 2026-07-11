# Estrategia de Búsqueda de Licitaciones — API MercadoPublico

> Documentación de las limitaciones de la API y las estrategias implementadas para obtener licitaciones de todas las regiones de Chile.

## Endpoint Base

```
GET https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json
```

## Parámetros Disponibles

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `ticket` | **Obligatorio.** API Key de MercadoPublico | `ticket=E18620F6...` |
| `codigo` | Código específico de una licitación | `codigo=1234-56-LP26` |
| `estado` | Código numérico de estado | `estado=5` (Publicada) |
| `fecha` | Fecha en formato **DDMMAAAA** | `fecha=04072026` |
| `pagina` | Número de página para paginación | `pagina=1`, `pagina=2` |
| `q` | Búsqueda texto libre | `q=camion+aljibe` |
| `monto` | Rango de monto `min\|max` | `monto=1000000\|50000000` |
| `organismo` | ID del organismo comprador | `organismo=6` |

### Códigos de Estado (`estado`)
| Código | Estado |
|--------|--------|
| `5` | Publicada |
| `6` | Cerrada |
| `8` | Adjudicada |

> ⚠️ **NO existe filtro `?region=...`** — la API no permite filtrar por región nativamente. Hay que post-filtrar del JSON.

## Estructura del JSON de Respuesta

El endpoint de **detalle** (`?codigo=...`) devuelve el objeto `Comprador` con datos completos:

```json
{
  "Listado": [{
    "CodigoExterno": "1234-56-LP26",
    "Nombre": "Título de la licitación",
    "Estado": "Publicada",
    "CodigoEstado": 5,
    "MontoEstimado": 5000000,
    "Moneda": "CLP",
    "FechaCierre": "2026-08-01T15:00:00",
    "Descripcion": "Descripción detallada...",
    "Tipo": "LP",

    "Comprador": {
      "NombreOrganismo": "Nombre Institución",
      "NombreUnidad": "Unidad de Compra",
      "DireccionUnidad": "Av. Ejemplo 123",
      "ComunaUnidad": "Santiago",           ← CAMPO COMUNA
      "RegionUnidad": "Región Metropolitana de Santiago",  ← CAMPO REGIÓN
      "CodigoOrganismo": "12345",
      "RutUnidad": "12.345.678-9"
    },

    "Fechas": {
      "FechaCreacion": "2026-07-01T09:00:00",
      "FechaCierre": "2026-08-01T15:00:00",
      "FechaPublicacion": "2026-07-02T00:00:00",
      "FechaAdjudicacion": "2026-08-15T00:00:00"
    }
  }]
}
```

> ⚠️ El endpoint de **lista** (`?fecha=...` o `?estado=...`) devuelve un objeto `Unidad` con **menos campos** que `Comprador`. Por eso el sync siempre consulta el detalle por código.

## Regiones de Chile — Valores en `Comprador.RegionUnidad`

| Código | Nombre completo en la API |
|--------|--------------------------|
| I | Región de Tarapacá |
| II | Región de Antofagasta |
| III | Región de Atacama |
| IV | Región de Coquimbo |
| V | Región de Valparaíso |
| VI | Región del Libertador General Bernardo O'Higgins |
| VII | Región del Maule |
| VIII | Región del Biobío |
| IX | Región de La Araucanía |
| X | Región de Los Lagos |
| XI | Región de Aysén del General Carlos Ibáñez del Campo |
| XII | Región de Magallanes y de la Antártica Chilena |
| RM | Región Metropolitana de Santiago |
| XIV | Región de Los Ríos |
| XV | Región de Arica y Parinacota |
| XVI | Región del Ñuble |

## Estrategias Implementadas

### Estrategia 1: Por Estado con Paginación (Primary)
```typescript
// getTendersByStatus() en mercadopublico.ts
GET ?estado=5&pagina=1  // Publicadas página 1
GET ?estado=5&pagina=2  // Publicadas página 2
... hasta que Listado.length === 0
```
- Obtiene licitaciones activas de **todas las regiones**
- Puede retornar 0 si la API está en cache/rate-limit

### Estrategia 2: Por Fecha con Paginación (Fallback automático)
```typescript
// getTendersByDateRange() en mercadopublico.ts
Para cada día hábil de los últimos 45 días:
  GET ?fecha=DDMMAAAA&pagina=1
  GET ?fecha=DDMMAAAA&pagina=2
  ... hasta agotar la página
```
- Se activa automáticamente si la Estrategia 1 devuelve 0
- Garantiza cobertura histórica de ~45 días laborales
- Incluye licitaciones de **todas las regiones** (sin filtro geográfico)

### Estrategia 3 (futura): Datos Abiertos
```
https://datosabiertos.chilecompra.cl
```
- Descarga mensual CSV/JSON completo
- Sin rate limiting
- Recomendada para histórico masivo (+1 año)

## Flujo del Sync Actual (`sync_direct.ts`)

```
1. getTendersByStatus('Publicada', ticket)
   ↓ si retorna 0 automáticamente:
   getTendersByDateRange(ticket, 45 días)
   ↓
2. Para cada licitación nueva (que no esté en BD):
   getTenderDetail(codigo, ticket)
   ↓
3. Extraer: Comprador.ComunaUnidad, Comprador.RegionUnidad
4. Calcular score con título real de la licitación
5. INSERT en PostgreSQL con todos los campos incluyendo buyerCommune
```

## Limitaciones Conocidas

| Limitación | Impacto | Mitigación |
|------------|---------|------------|
| No hay `?region=` nativo | No se puede filtrar por región en la llamada | Post-filtro en BD |
| Rate limiting agresivo | Descarga lenta | `sleep(150-200ms)` entre llamadas |
| Paginación sin offset | Solo `?pagina=N` | Loop hasta `Listado.length === 0` |
| `?estado=publicada` a veces retorna 0 | Fallo del endpoint | Fallback automático por fecha |
| Detalle solo accesible por código | Dos llamadas por licitación (lista + detalle) | Lotes de 5 paralelos en sync |

## Rate Limit Actual en el Sync
- **200ms** entre páginas de estado/fecha
- **150ms** entre páginas del mismo día  
- **5 llamadas en paralelo** al endpoint de detalle
- Límite de **500 licitaciones** por ejecución de sync
