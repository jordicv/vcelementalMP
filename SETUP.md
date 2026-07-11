# Guía de Instalación y Configuración — VC Elemental MP

Este documento contiene los pasos detallados para configurar y levantar la plataforma **VC Elemental MP** desde cero en cualquier computadora (Mac/Linux/Windows).

---

## 🏗️ Requisitos Previos

Asegúrate de tener instalados los siguientes componentes:
- **Node.js** (v18 o superior)
- **NPM** (v9 o superior)
- **Docker Desktop** (para la base de datos y la cola de tareas en local)

---

## 🚀 Pasos de Configuración Inicial

### 1. Clonar el repositorio y configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en la plantilla actual:
```env
# Base de datos
DATABASE_URL=postgresql://vcelemental:vcelemental_local@localhost:5432/vcelemental_mp

# Redis (para BullMQ)
REDIS_URL=redis://localhost:6379

# Mercado Público API (Token Maestro)
MP_ADMIN_TICKET=E18620F6-CC83-4690-96FC-CD61DC9FAE8D

# Gemini AI (API Key para los resúmenes del Dashboard)
GEMINI_API_KEY=tu_gemini_api_key_aqui
```

### 2. Levantar la infraestructura local (Docker)
Inicia los contenedores de PostgreSQL 16 y Redis 7 ejecutando:
```bash
docker compose up -d
```
*Esto creará los contenedores de forma aislada y expondrá los puertos estándar `5432` y `6379`.*

### 3. Crear las tablas de la base de datos (Drizzle ORM)
Usa Drizzle Kit para empujar y sincronizar el esquema físico a la base de datos en local:
```bash
npm run db:push
```

### 4. Sembrar datos iniciales (Seed)
Ejecuta el script de semilla para poblar la base de datos con la empresa "VC Elemental", tu usuario administrador de prueba y encolar el primer trabajo:
```bash
npm run db:seed
```

### 5. Sincronizar licitaciones reales (API ChileCompra)
Ejecuta la sincronización directa para descargar en vivo las licitaciones activas directamente a tu base de datos:
```bash
npm run db:sync
```

---

## 💻 Desarrollo

### Iniciar el servidor local de Astro
Ejecuta el servidor en modo desarrollo:
```bash
npm run dev -- --port 4322
```
Abre **[http://localhost:4322/dashboard](http://localhost:4322/dashboard)** en tu navegador.

### Iniciar workers de background (opcional)
Si deseas simular colas asíncronas de ingesta cada 15 minutos en background:
```bash
npm run workers
```

---

## 🛠️ Solución de Problemas

- **Error de conexión a base de datos (auth_failed):** Asegúrate de que no haya otro servicio nativo de Postgres corriendo en el puerto 5432 de tu máquina. Puedes liberar el puerto ejecutando:
  ```bash
  killall node || true
  npx kill-port 5432 || true
  ```
- **La API de ChileCompra no responde:** Si la API del gobierno responde con error 500 o 429 (límite de cuota), el worker activará automáticamente un fallback de 15 licitaciones de prueba realistas para que sigas desarrollando sin bloqueos.
