# Plan de Implementación: Guía Paso a Paso para Postular en Licitaciones

Este plan detalla la incorporación de una **Guía Paso a Paso interactiva y detallada** dentro de la vista de cada licitación en el panel de **Benthic MP** (`/dashboard/[id]`). El objetivo es orientar a la empresa postulante sobre cada etapa del proceso, destacando requisitos excluyentes, ponderaciones de evaluación, plazos críticos y estrategias para maximizar la probabilidad de adjudicación.

---

## User Review Required

> [!IMPORTANT]
> - **Visualización Prominente:** Proponemos incorporar la "Guía Paso a Paso 🚀" como la pestaña por defecto (o destacada al inicio) en el *Bidding Explorer* de la vista de detalle de cada licitación. Esto asegura que la empresa vea inmediatamente el checklist operativo para postular de forma correcta.
> - **Criterios de Desempate y Foro Inverso:** Se destacan alertas críticas de negocio en la interfaz, como el hecho de que subsanar errores formales a través de Foro Inverso penaliza un **3%** del puntaje, o que en caso de empate de puntajes la licitación se define por el **orden de ingreso de la oferta** en la plataforma de Mercado Público.
> - **Estrategia Multi-Agente:** Delegaremos la ejecución física en subagentes especializados:
>   1. **Subagente de Código:** Para programar los cambios lógicos y de UI.
>   2. **Subagente de Testing y Auditoría:** Para compilar el sitio (`npm run build`), verificar tipos (`npx astro check`) y auditar que no falte información de bases.
>   3. **Subagente de UI/UX:** Para verificar visualmente la consistencia del diseño glassmórfico y adaptabilidad móvil.

---

## Proposed Changes

### [Benthic MP - Capa de Presentación]

#### [MODIFY] [[id].astro](file:///Users/teddy/Documents/Proyectos/benthic-mp/src/pages/dashboard/[id].astro)

- **Lógica de Datos:**
  - Crear una estructura de datos `pasoAPaso` específica para las licitaciones conocidas:
    - **`1067476-19-LE26`**: Detalle del equipo mínimo exigido (Diseñador Anexo 6, Desarrollador Anexo 7), prohibición absoluta de subcontratación, ponderaciones (Propuesta 40%, Económica 30%, etc.), foro inverso y desempate por orden de llegada.
    - **`2175-7-LP26`**: Detalle de la reunión obligatoria informativa (Copiapó), propuesta económica (55%), y boletas de fiel cumplimiento a largo plazo.
  - Para licitaciones dinámicas: Generar un generador dinámico que tome `criteriosEvaluacion`, `etapasPlazos`, `requisitos` y `requisitosExcluyentes` de la licitación y arme una ruta paso a paso automatizada y coherente.
- **Estructura de la Interfaz:**
  - Agregar un botón de navegación especial en la barra lateral del Explorer: **"Guía Paso a Paso 🚀"** (situado al inicio para máxima prioridad).
  - Agregar el correspondiente `<div class="tab-panel" id="panel-pasoapaso">` con el contenido estructurado.
- **Diseño Visual (Aesthetics):**
  - Implementar un diseño de línea de tiempo o "timeline" vertical premium con indicadores numéricos en gradiente de color cian/azul.
  - Utilizar badges de advertencia rojos para requerimientos excluyentes y verdes para recomendaciones estratégicas.
  - Añadir selectores checkbox interactivos en el cliente (usando JavaScript en la página) para que la empresa marque sus avances en la postulación. El progreso se guardará de forma temporal en `localStorage` por licitación para que el usuario mantenga su progreso al recargar.

---

## Verification Plan

### Automated Tests
- Ejecutar verificación de sintaxis y tipos en el subagente de auditoría:
  ```bash
  npx astro check
  ```
- Compilar el bundle de producción para asegurar que no hay errores de compilación ni dependencias rotas:
  ```bash
  npm run build
  ```

### Manual Verification
- Levantar el servidor en el puerto 4322 (`npm run dev -- --port 4322`) y revisar la UI utilizando el subagente de UI en el navegador local.
- Comprobar que el checklist sea interactivo, que el porcentaje de avance se calcule correctamente y que los datos se persistan tras recargar la página.
