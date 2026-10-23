# 🎁 EntrePanas — Monorepo

Plataforma de **Amigo Secreto** para Venezuela. Nombre comercial: **EntrePanas** (antes *PanaSecreto*). El repositorio y los identificadores internos (scope `@panasecreto/*`, base de datos `panasecreto`, slug de Expo) conservan el nombre original; los detalles están en `docs/REVISION.md`. Es un monorepo con **pnpm workspaces** y **TypeScript**, desplegado con **Docker / Coolify**, y tiene app móvil en **React Native (Expo)**.

---

## 📁 Estructura

```plaintext
panasecreto/
├── apps/
│   ├── backend/         # Express + Mongoose + Socket.io (API REST + WebSockets)
│   ├── admin/           # Panel web (React 18 + Vite + Ant Design + Tailwind)
│   └── mobile/          # App móvil (Expo SDK 57 / React Native 0.86) — en maquetación
├── packages/
│   ├── shared/          # Esquemas Zod, enums, roles y tipos de negocio (CJS + ESM)
│   ├── ui-tokens/       # Tokens de diseño (paleta, espaciado, tipografía)
│   └── tsconfig/        # Configuraciones base de TypeScript
├── docs/
│   ├── REVISION.md      # Revisión del proyecto, pendientes y bitácora de cambios
│   └── API_GRUPOS.md    # Referencia de la API de grupos, sorteo y lista de deseos
├── docker-compose.yml   # MongoDB + Backend + Admin para entorno local
└── .env.example         # Variables para docker compose
```

## ✅ Estado de los módulos

| Módulo | Backend | Panel admin | App móvil |
|---|---|---|---|
| Autenticación, roles, recuperación por correo (Mailjet) | ✅ | ✅ | maqueta |
| Gestión de usuarios | ✅ | ✅ | — |
| Configuración del sistema (marca, logo) | ✅ | ✅ | — |
| Grupos, invitaciones, exclusiones, sorteo | ✅ | ✅ (supervisión) | maqueta |
| Lista de deseos (con imagen en Cloudinary) | ✅ | — | pendiente |
| Correos transaccionales (Mailjet, 12 plantillas) | ✅ | — | — |
| Dashboard con métricas | ✅ | ✅ | — |
| Chat anónimo | pendiente (con la app) | — | pendiente |

---

## 🎨 Identidad visual (`packages/ui-tokens`)

Logo, isotipo e íconos en [`assets/`](assets) (los usan la app y el panel); todas las piezas separadas en [`docs/identidad/entrepanas`](docs/identidad/entrepanas).

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#0B2D5B` | Azul Marino: color principal, encabezados, texto sobre amarillo |
| `secondary` | `#FFC107` | Amarillo Pana: botones principales y realces («Panas» del logotipo) |
| `accent` | `#00B4D8` | Celeste Caribe: enlaces, chips, información, gráficas |
| `coral` | `#FF5A3D` | Coral Guacamaya: badges, notificaciones, acentos festivos |
| `danger` | `#D62828` | Rojo: alertas y errores |
| `background` | `#F8F7F2` | Crema: fondo general |
| `textDark` | `#13213A` | Tinta Marina: texto de alto contraste |
| `surface` | `#FFFFFF` | Blanco Puro: tarjetas y superficies |

Tipografía: **Fredoka** (600/700) para titulares y marca, **Nunito** (400–900) para el texto. En la app se cargan con `@expo-google-fonts`; en el panel y los correos, desde Google Fonts.

---|---|---|
| `primary` | `#1E1338` | Morado Noche: color principal de marca |
| `secondary` | `#F7A800` | Amarillo Araguaney: acentos y llamadas a la acción |
| `accent` | `#1D84B5` | Azul Caribe: enlaces, estados activos, gráficas |
| `danger` | `#D62828` | Rojo Guacamaya: alertas y errores |
| `background` | `#F8F9FA` | Hueso Suave: fondo general |
| `textDark` | `#1C1B24` | Carbón Lente: texto de alto contraste |
| `surface` | `#FFFFFF` | Blanco Puro: tarjetas y superficies |

---

## 🚀 Desarrollo local

Requisitos: **Node.js ≥ 20** y **pnpm ≥ 9** (el proyecto fija `pnpm@11.4.0`).

```bash
pnpm install              # dependencias de todo el monorepo
pnpm build:packages       # compila shared y ui-tokens (necesario antes de correr las apps)
cp apps/backend/.env.example apps/backend/.env   # y completar

pnpm dev:backend          # API en http://localhost:4000
pnpm dev:admin            # Panel en http://localhost:3000
pnpm dev:mobile           # Expo Go (ver reglas en AGENTS.md)
```

Credenciales iniciales del panel (solo desarrollo): `admin@panasecreto.local` / `Admin123456!`. El sistema obliga a cambiar la contraseña en el primer inicio de sesión.

### Calidad: tests, tipos y lint

```bash
pnpm test           # tests de integración del backend con MongoDB en memoria
pnpm typecheck      # TypeScript en todos los paquetes
pnpm lint           # ESLint en todo el monorepo (pnpm lint:fix corrige lo automático)
```

ESLint usa una configuración única en `eslint.config.mjs` (ESLint 10, typescript-eslint y reglas de React Hooks para el admin y mobile). El monorepo está en **0 errores y 0 advertencias**, `any` está prohibido y `pnpm lint` falla ante cualquier advertencia (`--max-warnings 0`).

Los tests usan el runner nativo de Node (`node --test` + `tsx`) y `mongodb-memory-server`, y no necesitan una base de datos real ni servicios externos: Mailjet y Cloudinary se simulan. Son 103 tests sobre autenticación, roles, recuperación, grupos, sorteo, lista de deseos e imágenes, estadísticas y correos.

### Docker Compose

```bash
cp .env.example .env      # definir al menos JWT_KEY y USER_ADMIN_PASSWORD
docker compose up --build
```

- API: `http://localhost:4000` (salud en `/api/health`, responde 503 si no hay base de datos)
- Panel: `http://localhost:8080`
- MongoDB: `127.0.0.1:27017` (solo accesible desde la máquina local)

---

## 🔐 Variables de entorno del backend

| Variable | Obligatoria en producción | Descripción |
|---|---|---|
| `MONGO_URI` | ✅ | Cadena de conexión de MongoDB |
| `JWT_KEY` | ✅ | ≥ 32 caracteres aleatorios (`openssl rand -hex 32`). Sin ella el servidor no arranca |
| `USER_ADMIN_PASSWORD` | ✅ (primer arranque) | Contraseña del admin semilla. Sin ella no se crea |
| `USER_ADMIN_EMAIL`, `USER_ADMIN_NAME` | — | Datos del admin semilla |
| `CORS_ORIGIN` | ✅ | Dominios permitidos separados por coma (ej. `https://admin.tudominio.com`) |
| `MJ_APIKEY_PUBLIC`, `MJ_APIKEY_PRIVATE` | ✅ | Credenciales de Mailjet (correo de recuperación) |
| `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` | ✅ | Remitente validado en Mailjet |
| `MAIL_LOGO_URL` | — | Logo del encabezado de los correos. Por defecto se usa la imagen que sube `pnpm --filter @panasecreto/backend mail:logo` a Cloudinary (`EntrePanas/branding/email-logo-horizontal`) |
| `MAIL_TRANSPORT` | — | `log` para solo imprimir correos en consola |
| `APP_PUBLIC_URL` | ✅ | URL pública de la app (enlaces de los correos, invitaciones `…/join/CÓDIGO`) |
| `ADMIN_PUBLIC_URL` | ✅ | URL del panel (enlace en el correo de cuenta creada) |
| `UPLOAD_TRANSPORT` | — | `mock` simula Cloudinary (tests / desarrollo sin credenciales) |
| `CLOUD_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`, `FOLDER_NAME` | ✅ | Imágenes en Cloudinary: `<FOLDER_NAME>/avatars`, `/branding` y `/wishlist` |
| `BCRYPT_ROUNDS` | — | Costo de bcrypt (mínimo 10) |
| `REPORT_TIMEZONE` | — | Zona horaria de las estadísticas (por defecto `America/Caracas`) |

---

## 🚢 Despliegue en Coolify

### Backend (`apps/backend`)
- **Tipo**: Dockerfile · **Base Directory**: `/` · **Dockerfile**: `apps/backend/Dockerfile` · **Puerto**: `4000`
- Definir las variables de la tabla anterior con `NODE_ENV=production` (**solo runtime** en Coolify: desmarcar “Available at Buildtime”).
- Las variables de Google OAuth y secretos van **solo en runtime**, no en build.
- Healthcheck incluido (`/api/health`).

### Panel admin (`apps/admin`)
- **Tipo**: Dockerfile · **Base Directory**: `/` · **Dockerfile**: `apps/admin/Dockerfile` · **Puerto**: `80`
- **Build Variable** `VITE_API_URL=https://entrepanas-api.erdesarrollo.com.ve`: la URL de la API queda incrustada al compilar.
- Producción (Coolify, proyecto **ErDesarrollo**): API `https://entrepanas-api.erdesarrollo.com.ve`, panel `https://entrepanas.erdesarrollo.com.ve`.
- Nginx sirve la SPA con gzip, CSP y cabeceras de seguridad.

---

## 📱 Móvil (Expo + pnpm)

Reglas obligatorias en [`AGENTS.md`](./AGENTS.md): solo Expo Go, prohibido `expo export`, sin Tailwind/NativeWind y estilos centralizados en `src/styles/`.

`apps/mobile/metro.config.js` resuelve los paquetes del monorepo (`watchFolders` + `nodeModulesPaths`), así que se puede importar directamente:

```typescript
import { colors } from '@panasecreto/ui-tokens';
import { GroupStatusEnum, CreateGroupSchema } from '@panasecreto/shared';
```

---

## 📚 Documentación

- [`docs/REVISION.md`](./docs/REVISION.md): hallazgos, pendientes y bitácora de cambios.
- [`docs/API_GRUPOS.md`](./docs/API_GRUPOS.md): API de grupos, sorteo, sobres y lista de deseos.
