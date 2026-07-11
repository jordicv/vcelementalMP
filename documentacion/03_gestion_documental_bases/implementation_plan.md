# Plan de Implementación: Estructuración de 9 Puntos Clave en Licitaciones

Este plan describe el rediseño de la página de detalles de licitación en Benthic OPS para estructurar, organizar y visualizar detalladamente la información técnica, administrativa y de adjudicación en **9 puntos clave específicos**. 

---

## Objetivos del Rediseño

Facilitar la toma de decisiones y el análisis de compatibilidad para las empresas oferentes, organizando el contenido en 9 puntos esenciales con navegación fluida y un diseño premium.

### Los 9 Puntos Clave a Mostrar
1. **📋 Características de la licitación**: Metadatos generales, tipo de proceso, estado y links oficiales.
2. **🏢 Organismo demandante**: Información del comprador, RUT, ubicación y contactos clave del proceso.
3. **📅 Etapas y plazos**: Calendario detallado de hitos y plazos máximos para consultas y ofertas.
4. **📂 Antecedentes para incluir en la oferta**: Documentos requeridos (Administrativos, Técnicos y Económicos).
5. **🛡️ Requisitos para contratar**: Condiciones y certificaciones necesarias para la contratación final del adjudicatario (ChileProveedores, F30-1).
6. **📊 Criterios de evaluación**: Matriz de ponderación detallada del puntaje de adjudicación.
7. **💰 Montos y duración**: Presupuesto total, plazos de servicio, condiciones de pago y subcontratación.
8. **🔐 Garantías requeridas**: Detalle de boletas de seriedad de la oferta y fiel cumplimiento.
9. **⚙️ Requerimientos técnicos y otras cláusulas**: Especificaciones técnicas clave, perfiles requeridos, foro inverso y desempate.

---

## Cambios Propuestos

### 1. Base de Datos y Sembrado

#### [MODIFY] [seed.ts](file:///Users/teddy/Documents/Proyectos/benthic-mp/src/db/seed.ts)
Actualizaremos los datos de la licitación real `1067476-19-LE26` para estructurar la propiedad `textoBases` en `rawData` como un objeto que declare explícitamente información para cada uno de los 9 puntos.

---

### 2. Estructura y Capa de Presentación (Frontend)

#### [MODIFY] [[id].astro](file:///Users/teddy/Documents/Proyectos/benthic-mp/src/pages/dashboard/%5Bid%5D.astro)
- **Resolutor Inteligente de 9 Puntos**:
  Implementaremos una función en el frontmatter que compile estos 9 puntos:
  - Para `1067476-19-LE26`: Usará la información oficial exacta cargada en base de datos.
  - Para licitaciones de la API: Generará dinámicamente resúmenes detallados para cada uno de los 9 puntos basados en la información de metadatos del comprador, fechas del calendario de la API y el resumen `aiSummary`.
- **Diseño de Interfaz Premium**:
  - Crearemos un menú lateral de navegación táctil/de clic (Sidebar Tabs) a la izquierda de la tarjeta principal.
  - El menú tendrá botones estilizados con transiciones y HSL accent colors para cambiar dinámicamente entre las 9 secciones.
  - Las transiciones se manejarán mediante JavaScript del lado del cliente (`Vanilla JS` integrado en Astro) para asegurar máxima velocidad de respuesta sin recargas de página.

---

## Plan de Verificación

### Pruebas de Compilación y Base de Datos
- Ejecutar `npm run db:seed` para refrescar los datos.
- Ejecutar `npm run build` para asegurar la estabilidad del tipado en TypeScript.

### Verificación Manual de Flujo y Diseño
- Abrir la ruta `/dashboard/1067476-19-LE26`.
- Hacer clic en cada una de las 9 pestañas del menú lateral y certificar que la información de bases se muestre de forma ordenada y atractiva.
- Probar el comportamiento en una licitación sincronizada desde la API para asegurar que los fallbacks muestren los 9 puntos de forma inteligible.
