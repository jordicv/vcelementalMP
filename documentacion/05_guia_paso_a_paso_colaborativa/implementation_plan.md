# Plan de Implementación: Guía de Postulación Personalizada y Colaborativa

Este plan detalla las mejoras en la sección **Guía Paso a Paso 🚀** de cada licitación en el panel de **Benthic MP** (`/dashboard/[id]`). El objetivo es pasar de una lista estática/genérica a un sistema dinámico, interactivo y colaborativo que permita llevar un seguimiento del proceso de postulación y hacerlo más ameno y gamificado.

---

## User Review Required

> [!IMPORTANT]
> - **Generación 100% Dinámica:** Reemplazaremos los checklists estáticos por un motor analizador (`generatePasoAPaso`) que lee la información estructurada de las bases de la licitación (`dbTextoBases`) en tiempo real. Extrae automáticamente reuniones obligatorias, prohibición de subcontratación, documentos del listado de anexos, y ponderaciones de evaluación.
> - **Seguimiento Completo (CRM de Postulación):** Añadiremos selectores interactivos por cada tarea para:
>   1. **Asignar Responsables:** Seleccionar de entre el equipo real de la empresa (usuarios registrados).
>   2. **Definir Estados:** Estados de tareas (`Pendiente` ⭕, `En Proceso` ⏳, `Completado` ✅).
>   3. **Comentarios/Notas:** Un campo de texto inline para dejar comentarios y apuntes operativos por tarea.
> - **Gamificación y Celebraciones:** Al completarse el 100% de la checklist, se activará un efecto visual de confeti sobre el panel mediante un Canvas autogestionado, junto a un mensaje motivador.
> - **Historial de Actividad:** Cada cambio de estado, asignación o comentario guardará un registro con marca de tiempo en `localStorage`, visible en un panel lateral de "Historial de Cambios" para auditoría interna del equipo.

---

## Proposed Changes

### [Benthic MP - Capa de Datos y Vista]

#### [MODIFY] [[id].astro](file:///Users/teddy/Documents/Benthic%20OPS/benthic-mp/src/pages/dashboard/[id].astro)

- **Consultar Usuarios del Equipo:**
  - Importar la tabla `users` de la base de datos y realizar un query de todos los usuarios de la compañía actual. Esto alimentará la lista de posibles encargados para cada tarea.
- **Implementar Generador Dinámico de la Guía (`generatePasoAPaso`):**
  - Crear una función server-side que reciba el objeto de licitación (`tender`), el texto de bases estructurado (`dbTextoBases`) y los metadatos (`rawDataObj`).
  - Dividir el proceso en 4 Fases:
    - **Fase 1: Admisibilidad y Hitos de Aclaración 🔍** (Reuniones obligatorias, visitas a terreno, foro de consultas).
    - **Fase 2: Preparación de Anexos Administrativos 📂** (Documentación de antecedentes, ChileProveedores, Boleta de seriedad).
    - **Fase 3: Desarrollo de la Propuesta Técnica y Equipo ⚙️** (Construcción del plan metodológico y anexos de perfiles técnicos).
    - **Fase 4: Oferta Económica, Calidad y Envío 🚀** (Formulario de precios ajustado a presupuestos, revisión de foro inverso y desempate por orden de ingreso).
- **Diseñar la Nueva Interfaz del Panel:**
  - Agregar un Canvas transparente al contenedor de la guía para el efecto de confeti.
  - Implementar tarjetas colapsables (tipo Acordeón) para cada Fase, mostrando cuántos ítems han sido completados en tiempo real.
  - Diseñar controles compactos para cada ítem de la lista:
    - Selector desplegable de Responsable.
    - Selector desplegable de Estado.
    - Caja de texto oculta/colapsable de Notas.
  - Incorporar el panel **Historial de Actividad 📝** en la parte inferior o lateral derecha de la guía para mostrar el log cronológico de cambios.
  - Botón de **Exportar Checklist** para copiar el estado completo del proceso en texto y compartirlo por correo/WhatsApp.
- **Actualizar Lógica de Persistencia y Reactividad (JavaScript en Cliente):**
  - Usar un esquema de llaves único para guardar el objeto completo `{ status, assignee, notes }` por cada tarea en `localStorage`.
  - Escuchar cambios en los inputs para recalcular la barra de progreso, redibujar las fases completadas, registrar la acción en el log cronológico, e iniciar la animación de confeti si el progreso alcanza el 100%.

---

## Verification Plan

### Automated Tests
- Ejecutar verificación estática de TypeScript y compilación del Astro router:
  ```bash
  npx astro check
  ```
- Compilar la aplicación en producción para verificar que no hay fallos de tipado ni dependencias:
  ```bash
  npm run build
  ```

### Manual Verification
- Levantar el servidor en el puerto local y comprobar visualmente en el navegador:
  - Generación dinámica de tareas según los metadatos de la licitación seleccionada.
  - Selección de responsables del equipo de Benthic OPS (por ejemplo, José Valdés).
  - Persistencia de estados, asignaciones y notas tras recargar la página.
  - El correcto renderizado de logs en el Historial de Actividad.
  - Animación del confeti y cambio de color/estado de la línea de tiempo a 100%.
