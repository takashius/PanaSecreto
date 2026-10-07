# 🎁 PanaSecreto — Monorepo

Arquitectura monorepo empresarial para la plataforma **PanaSecreto** (Amigo Secreto), impulsada por **pnpm workspaces**, **TypeScript**, **Docker** y optimizada para despliegues independientes en **Coolify** y desarrollo móvil con **React Native / Expo**.

---

## 📁 Estructura del Monorepo

```plaintext
panasecreto/
├── apps/
│   ├── backend/         # Node.js + Express + Mongoose + Socket.io (REST + WebSockets)
│   ├── admin/           # Dashboard Web (React 18 + Vite + Tailwind CSS)
│   └── mobile/          # React Native (Expo SDK 52 configurado para monorepo pnpm)
├── packages/
│   ├── shared/          # Interfaces TypeScript, esquemas Zod y enums de negocio
│   ├── ui-tokens/       # Tokens de diseño (paleta oficial, espaciados, tipografía)
│   └── tsconfig/        # Configuraciones base de TypeScript reutilizables
├── docker-compose.yml   # Orquestación de servicios locales (MongoDB + Backend + Admin)
├── pnpm-workspace.yaml  # Definición de workspaces pnpm
├── package.json         # Scripts de orquestación global
└── .gitignore           # Exclusiones de dependencias, builds y mobile
```

---

## 🎨 Paleta de Colores Oficial (`packages/ui-tokens`)

| Token | Hex | Nombre / Uso |
|---|---|---|
| `primary` | `#1E1338` | Morado Noche (Color principal de marca) |
| `secondary` | `#F7A800` | Amarillo Araguaney (Acentos festivos y llamadas a la acción) |
| `accent` | `#1D84B5` | Azul Caribe (Enlaces, estados activos y badges) |
| `danger` | `#D62828` | Rojo Guacamaya (Alertas, cancelaciones y errores) |
| `background` | `#F8F9FA` | Hueso Suave (Fondo general de interfaces) |
| `textDark` | `#1C1B24` | Carbón Lente (Texto de alto contraste) |
| `surface` | `#FFFFFF` | Blanco Puro (Tarjetas, modales y superficies) |

---

## 🚀 Requisitos Previos

- **Node.js**: `>= 20.0.0` (LTS recomendado)
- **pnpm**: `>= 9.0.0` (o versión actual `11.x`)
- **Docker & Docker Compose** (para despliegues y pruebas en contenedores)

---

## 🛠️ Instalación y Configuración Local

1. **Instalar todas las dependencias del monorepo:**
   ```bash
   pnpm install
   ```

2. **Compilar los paquetes compartidos:**
   ```bash
   pnpm build:packages
   ```

3. **Ejecutar aplicaciones en modo desarrollo:**
   - **Backend API & WebSockets (puerto 4000):**
     ```bash
     pnpm dev:backend
     ```
   - **Panel Administrativo Vite (puerto 3000):**
     ```bash
     pnpm dev:admin
     ```
   - **App Móvil Expo / React Native:**
     ```bash
     pnpm dev:mobile
     ```

4. **Compilar todo el monorepo:**
   ```bash
   pnpm build
   ```

5. **Levantar entorno local completo con Docker Compose:**
   ```bash
   docker compose up --build
   ```
   - Backend API: `http://localhost:4000`
   - Dashboard Web: `http://localhost:8080`
   - MongoDB: `localhost:27017`

---

## 🚢 Guía de Despliegue en Coolify

Coolify permite desplegar cada servicio del monorepo de manera independiente utilizando Git y Dockerfiles multi-stage.

### 1. Despliegue de `apps/backend`
- **Application Type**: Dockerfile
- **Base Directory**: `/` (Raíz del monorepo para resolver `packages/shared`)
- **Dockerfile Location**: `apps/backend/Dockerfile`
- **Exposed Port**: `4000`
- **Variables de Entorno recomendadas**:
  * `PORT=4000`
  * `NODE_ENV=production`
  * `MONGO_URI=mongodb://<usuario>:<password>@<host-mongo>:27017/panasecreto`
  * `CORS_ORIGIN=https://admin.tudominio.com`
  * `JWT_SECRET=generar_un_hash_seguro`

### 2. Despliegue de `apps/admin`
- **Application Type**: Dockerfile
- **Base Directory**: `/` (Raíz del monorepo para resolver `packages/*`)
- **Dockerfile Location**: `apps/admin/Dockerfile`
- **Exposed Port**: `80` (Servido por Nginx con gzip, seguridad y fallback SPA)

---

## 📱 Configuración Móvil (Expo + pnpm Monorepo)

React Native y Metro por defecto tienen dificultades para resolver paquetes symlinkeados fuera del directorio de la aplicación. En `apps/mobile/metro.config.js` se implementó la solución oficial:

```javascript
// apps/mobile/metro.config.js
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
```

Esto permite consumir directamente:
```typescript
import { colors } from '@panasecreto/ui-tokens';
import { GroupStatusEnum } from '@panasecreto/shared';
```
sin necesidad de duplicar paquetes ni romper la resolución de dependencias nativas.
