# 📚 Portal de Documentación del Proyecto - Benthic MP

Este directorio centraliza todos los planes de diseño, especificaciones, bitácoras de tareas e informes de implementación realizados a lo largo del ciclo de vida del proyecto **Benthic Mercado Público**. Cada hito funcional completado se documenta aquí para mantener la trazabilidad arquitectónica.

---

## 📂 Estructura de Documentación

### [01. Análisis Inicial y Arquitectura](./01_analisis_inicial_y_arquitectura)
* Documentación del diseño base del proyecto, análisis de la pila tecnológica (Next.js/Astro, Drizzle, PostgreSQL, BullMQ, Tailwind) y estrategias iniciales de conexión con la API pública de ChileCompra.

### [02. Gestión de Límites Financieros](./02_gestion_limites_financieros)
* Especificaciones técnicas e implementación del control de presupuestos operacionales de la empresa (mínimos y máximos), adaptados para soportar monedas múltiples (CLP, UF, UTM, USD).

### [03. Gestión Documental de Bases](./03_gestion_documental_bases)
* Implementación del explorador interactivo de bases de licitación, visor estructurado de requerimientos mínimos, descargador de archivos adjuntos y parsing inteligente de textos oficiales.

### [04. Estrategia Maestra de Licitación](./04_estrategia_maestra_bidding)
* Integración del motor de scoring inteligente de compatibilidad y los primeros pasos del visor y la bitácora inicial del checklist.

### [05. Guía Paso a Paso Colaborativa](./05_guia_paso_a_paso_colaborativa)
* Implementación del visor por fases (acordeones dinámicos de admisibilidad, anexos, desarrollo técnico y oferta), delegación de hitos a integrantes del equipo (users), bitácora de comentarios y avances operativos en tiempo real, exportador de reportes en Markdown y confetti de logros.

---

*Nota: Toda nueva mejora funcional o cambio estratégico en el proyecto agregará su respectivo plan e informe de cambios (`walkthrough.md`) a esta carpeta.*
