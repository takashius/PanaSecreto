# Revisión del proyecto EntrePanas (antes PanaSecreto)

> Fecha: 2026-10-20 · Alcance: monorepo completo (`apps/backend`, `apps/admin`, `apps/mobile`, `packages/*`, Docker y docs).
> Estado de compilación al momento de la revisión: `tsc --noEmit` pasa en los 5 paquetes.

Leyenda: 🔴 crítico · 🟠 importante · 🟡 menor · ✅ corregido

---

## Prioridad 1 — Seguridad crítica (backend)

- [x] ✅ 🔴 **Escalada de privilegios al crear usuarios.** `POST /user/admin` acepta cualquier `role` en el body; un ADMIN puede crear un SUPER_ADMIN. No se usa `assignableRolesFor()`.
  _Archivos:_ `components/user/network.ts`, `store.ts` (`createUserAdmin`).
- [x] ✅ 🔴 **ADMIN puede tomar control de un SUPER_ADMIN.** `PATCH /user/admin/:id`, `/:id/password`, `/:id/active` y `/:id/force-password-change` no verifican la jerarquía del usuario objetivo.
- [x] ✅ 🔴 **Cambio de contraseña sin la contraseña actual.**
  - `PATCH /user/me` y `PATCH /user` aceptan `password` y la cambian directamente.
  - `POST /user/change_password_required` cambia la clave sin validar que el usuario tenga `forcePasswordChangeOnNextLogin = true`.
- [x] ✅ 🔴 **`JWT_KEY` por defecto en producción.** `apps/backend/Dockerfile` define `ENV JWT_KEY=...default...`, lo que anula la validación `requireEnv`. `docker-compose.yml` también tiene el secreto escrito en el archivo.
- [x] ✅ 🔴 **Admin semilla con contraseña conocida.** Sin `USER_ADMIN_PASSWORD`, se crea `admin@panasecreto.local / Admin123456!`, también en producción.
- [x] ✅ 🟠 **Recuperación de contraseña débil.** Ahora el código se envía por correo con Mailjet, el paso 1 es `POST /user/recovery/request`, el código sale de `crypto.randomInt`, hay un límite de 5 intentos por cuenta y 60 s de espera entre reenvíos, y `devCode` solo aparece en desarrollo/test.
  - No se envía correo; en producción el código solo se imprime en el log.
  - `devCode` se devuelve en la respuesta en cualquier entorno distinto de `production` (incluido `staging`).
  - El código se genera con `Math.random` (usar `crypto.randomInt`).
  - Límite de intentos solo por IP: falta un contador por cuenta que invalide el código tras N fallos.
  - El paso 1 es un `GET` con el email en la URL (queda en logs y proxies).
- [x] ✅ 🟠 `POST /user/register` no tiene rate limit.
- [x] ✅ 🟠 Al cambiar la contraseña (voluntario o por perfil) no se cierran las otras sesiones.
- [x] ✅ 🟡 bcrypt con costo 8 (recomendado ≥ 10).
- [x] ✅ 🟡 El arreglo `tokens` del usuario crece sin límite (no se purgan los expirados).
- [x] ✅ 🟡 `listUsersAdmin` mete `q` directo en un `RegExp` (riesgo de ReDoS e inyección de regex). Hay que escaparlo.
- [x] ✅ 🟡 `controllerError` y `sendOrError` ya no exponen mensajes internos: los errores inesperados responden 500 genérico y el detalle queda en el log del servidor; los 4xx (409/422) se respetan.
- [x] ✅ 🟡 Con `CORS_ORIGIN=*` se reflejan todos los orígenes con `credentials: true`.
- [x] ✅ 🟡 Se permiten subidas SVG (posible XSS si se sirven directamente).
- [x] ✅ 🟡 El admin web no obliga el flujo de `forcePasswordChangeOnNextLogin`: el usuario puede navegar a otras rutas.

## Prioridad 2 — Build de `packages/shared`

- [x] ✅ 🔴 `shared` (y `ui-tokens`) compilan como ESM sin `"type": "module"` y con imports de directorio. `require('@panasecreto/shared')` desde el backend **falla** con `ERR_UNSUPPORTED_DIR_IMPORT`. Bloquea el módulo de grupos.

## Prioridad 3 — Módulo de grupos y sorteo (núcleo del producto)

- [x] ✅ 🔴 `routes/group.routes.ts` y `models/group.model.ts` existen pero **no están montados** en `config/routes.ts`.
- [x] ✅ 🔴 Las rutas de grupos no tienen autenticación y usan `creatorId: 'user_demo_123'` y datos del body.
- [x] ✅ 🔴 Falta el algoritmo de sorteo (con exclusiones) y las transiciones WAITING → LOCKED → REVEALED → COMPLETED.
- [x] ✅ 🟠 `/join` solo busca el grupo; no agrega al miembro.
- [x] ✅ 🟠 El código de invitación es corto (`Math.random`, 4 caracteres) y no maneja colisiones.
- [x] ✅ 🟠 `GET /groups` lista todos los grupos del sistema sin filtrar por usuario.
- [x] ✅ 🟠 El esquema `CreateGroupSchema` no cubre lo que pide el diseño mobile: presupuesto mín./máx. o "sin límite", moneda VES, número de participantes y pistas anónimas.
- [x] ✅ 🟡 Wishlist (`gift.schema.ts`) definida, sin modelo ni rutas.

## Prioridad 4 — App móvil conectada al backend

- [ ] 🔴 Todo es simulado: login (`'mock-jwt-token'`), registro, recuperación, inicio y crear grupo usan `setTimeout` y datos fijos.
- [ ] 🟠 No hay cliente HTTP, URL de API (`EXPO_PUBLIC_API_URL`) ni sesión guardada (SecureStore).
- [ ] 🟡 `@react-navigation/*` está instalado pero no se usa; la navegación es un arreglo hecho a mano en `App.tsx`.
- [ ] 🟡 `Alert.prompt` (unirse con código) solo existe en iOS.
- [ ] 🟡 `styles/theme.ts` importa los tokens pero vuelve a escribir los colores a mano.
- [ ] 🟡 El botón de Google no tiene implementación.

## Prioridad 5 — Chat anónimo (Socket.io)

- [ ] 🟠 `sockets/chat.socket.ts` no se registra en `index.ts`.
- [ ] 🔴 (al activarlo) `join_group_room` deja entrar a cualquier sala sin verificar membresía, y el remitente no se valida contra el grupo.
- [ ] 🟡 Los mensajes no se guardan.

## Despliegue e infraestructura

- [x] ✅ 🟠 El Dockerfile del admin no recibe `VITE_API_URL` como `ARG`, así que el build de producción apunta a `http://localhost:4000`.
- [x] ✅ 🟠 El backend arranca aunque Mongo falle ("modo degradado") y las peticiones se quedan colgadas en el buffer de Mongoose. Hay que fallar rápido o desactivar `bufferCommands`.
- [x] ✅ 🟡 `docker-compose.yml`: `CORS_ORIGIN` ya no es `*` por defecto y Mongo solo escucha en `127.0.0.1`. _(Mongo local sigue sin usuario/contraseña; es aceptable solo para desarrollo.)_
- [x] ✅ 🟡 `nginx.conf` sin `Content-Security-Policy`; `X-XSS-Protection` está obsoleto.

## Deuda técnica y consistencia

- [x] ✅ 🟡 Código muerto eliminado: `config/index.ts`, `models/*.model.ts`, `routes/group.routes.ts` y `admin/src/App.tsx`.
  - `backend/src/config/index.ts` (config duplicada).
  - `backend/src/models/user.model.ts` (segundo modelo `User`, provocaría `OverwriteModelError`).
  - `admin/src/App.tsx` (maqueta vieja).
- [x] ✅ 🟡 El README dice Expo SDK 52 (es 57) y no documenta las variables de Cloudinary ni `USER_ADMIN_*`.
- [x] ✅ 🟡 `.cursorrules` dice que solo SUPER_ADMIN/ADMIN entran al panel, pero el código también deja entrar a ORGANIZER.
- [x] ✅ 🟡 El `background` del admin en Tailwind (`#F5F5F5`) no coincide con el token (`#F8F9FA`).
- [x] ✅ 🟡 Los roles están duplicados entre backend y admin; deberían vivir en `packages/shared`.
- [x] ✅ 🟡 Rutas duplicadas eliminadas (`PATCH /user`, `/user/me/photo`, `/user/me/logout`, `PATCH /api/config`). _(Se mantienen los montajes `/user` y `/api/user` por compatibilidad.)_
- [x] ✅ 🟡 Tests (82, `pnpm test`) y ESLint (`pnpm lint`, 0 errores). _(Quedan 60 advertencias de `any` como tipado pendiente.)_
- [x] ✅ 🟡 Textos de "UniSan" eliminados del backend y del admin; el dashboard ahora muestra datos reales. _(Quedan comentarios en el código de mobile, que no se tocó.)_

---

## Bitácora de correcciones

### 2026-10-20 — Prioridad 1 (seguridad) y Prioridad 2 (build de `shared`)

**Backend**
- `config/roles.ts`: nueva función `canManageTarget()`. Un ADMIN no puede gestionar a un SUPER_ADMIN.
- `components/user/store.ts`, `controller.ts` y `network.ts`:
  - Crear usuario valida el rol contra `assignableRolesFor()` del actor (403 si no puede asignarlo, 400 si el rol no existe).
  - Editar, desactivar, resetear clave y forzar cambio verifican la jerarquía del usuario objetivo.
  - Nadie puede desactivarse a sí mismo; desactivar a alguien revoca sus sesiones.
  - `PATCH /user/me` ya no cambia la contraseña (responde 400 e indica usar `/change-password`).
  - `/change-password` exige la contraseña actual y cierra las demás sesiones.
  - `/change_password_required` solo funciona si el usuario tiene `forcePasswordChangeOnNextLogin` (si no, 403).
  - Recuperación: código con `crypto.randomInt`, `devCode` solo en development/test y el código se invalida tras 5 intentos fallidos por cuenta.
  - Búsqueda de usuarios con la regex escapada; el filtro de rol se valida.
  - Las respuestas ya no exponen `recoveryCode`, `recoveryCodeExpires` ni `recoveryAttempts`.
- `components/user/model.ts`: bcrypt con costo configurable (mínimo 10), campo `recoveryAttempts` y purga de tokens expirados al iniciar sesión.
- `config/commons.ts`: en staging/production, `JWT_KEY` es obligatoria, de al menos 32 caracteres y distinta de los valores de ejemplo conocidos. Sin contraseña por defecto para el admin semilla.
- `middleware/seed.ts`: si no hay `USER_ADMIN_PASSWORD` en producción, no se crea el admin. El admin semilla queda con `forcePasswordChangeOnNextLogin = true`.
- `middleware/rateLimit.ts`: nuevo `registerRateLimiter` (10 registros/hora por IP).

**Docker y configuración**
- `apps/backend/Dockerfile`: eliminado el `ENV JWT_KEY` por defecto.
- `docker-compose.yml`: los secretos se leen de `.env` (`${JWT_KEY:?...}`, `${USER_ADMIN_PASSWORD:?...}`) y `CORS_ORIGIN` usa `http://localhost:8080` por defecto. Nuevo `.env.example` en la raíz.
- `apps/backend/.env.example`: documenta `JWT_KEY`, `USER_ADMIN_*` y `BCRYPT_ROUNDS`.

**Admin web**
- `constants/roles.ts` + `UserFormModal.tsx`: el selector de rol solo ofrece los roles que el usuario actual puede asignar.

**Paquetes compartidos**
- `packages/shared` y `packages/ui-tokens` se compilan en doble formato: `dist/cjs` (backend con `require`) y `dist/esm` (Vite/Metro), con `exports` condicionales.
- ⚠️ Quedan archivos viejos en `packages/*/dist/` (raíz y `dist/types`) que ya no se usan. Se pueden borrar (están en `.gitignore`).

**Verificación**
- `tsc --noEmit` pasa en los 5 paquetes; el build del backend y el `vite build` del admin pasan.
- `require('@panasecreto/shared')` funciona desde el backend.
- Prueba de humo contra MongoDB en memoria: **22/22 casos OK** (escalada de roles, cambio de contraseña, recuperación con contador, revocación de sesiones, regex).
- `NODE_ENV=production` se niega a arrancar sin `JWT_KEY`, o con una clave corta o de ejemplo.

> **Impacto para despliegues existentes:** en Coolify hay que definir `JWT_KEY` (≥ 32 caracteres) y `USER_ADMIN_PASSWORD` antes de redesplegar. Para `docker compose`, copiar `.env.example` a `.env`.

### 2026-10-20 — Prioridad 3 (módulo de grupos y sorteo)

Referencia completa de la API: [`docs/API_GRUPOS.md`](./API_GRUPOS.md).

**`packages/shared`**
- Nuevos `CurrencyEnum` (USD/VES) y límites `GROUP_MIN_PARTICIPANTS` / `GROUP_MAX_PARTICIPANTS` (3–50).
- `CreateGroupSchema` alineado con el diseño mobile: `budgetMin`/`budgetMax` (null = sin límite), `currency`, `maxParticipants`, `anonymousClues`, `emoji`; la fecha se convierte a `Date` y se valida el rango del presupuesto.
- `UpdateGroupSchema` ya no permite cambiar `status` (estricto). Nuevos `SetExclusionsSchema`, `GroupSummary` y `AssignmentView`.

**Backend — nuevo `components/group/`** (misma arquitectura network → controller → store que `user`)
- `model.ts`: `Group` (miembros con referencia a `User`, exclusiones y `membersVersion`) y `Assignment` en una colección aparte con índices únicos.
- `draw.ts`: algoritmo de sorteo (muestreo por rechazo uniforme + emparejamiento de Kuhn de respaldo).
- `store.ts`: crear, mis grupos, vista previa por código, unirse (atómico, respeta el cupo con concurrencia), editar, eliminar, salir, expulsar, exclusiones mutuas con aviso de factibilidad, regenerar código, sortear, deshacer, revelar, finalizar, mi sobre, lista revelada y listado admin.
- Montado en `/group` y `/api/group`.
- `utils/http.ts`: `sendOrError` envía los 4xx tal cual y oculta el detalle de los 5xx.

**Verificación**
- `tsc --noEmit` pasa en los 5 paquetes; el build del backend pasa.
- Algoritmo: 4.000 casos aleatorios contra fuerza bruta sin errores; 50 personas con 25 parejas excluidas (300/300); casos imposibles detectados; distribución uniforme (n=4: las 9 asignaciones posibles ~2.000 veces cada una en 18.000 sorteos).
- API end-to-end contra MongoDB en memoria: **62/62 casos OK** (permisos, privacidad del sobre, exclusiones, cupo con concurrencia, estados, admin).
- Las pruebas de seguridad de la prioridad 1 siguen en 22/22.

**Pendiente relacionado**
- La app móvil todavía no consume esta API (prioridad 4). Ojo: el selector de fecha de mobile hoy produce texto ("24 de Diciembre, 2025") y la API espera una fecha ISO.
- Wishlist (`gift.schema.ts`) sigue sin modelo ni rutas.
- No hay tests automatizados en el repo: las pruebas se corrieron con scripts temporales. Conviene llevarlas a Vitest + Supertest + `mongodb-memory-server`.

### 2026-10-20 — Backend y panel admin completos

**Tests automatizados** (`pnpm --filter @panasecreto/backend test`)
- `src/app.ts` separa la app Express del arranque, para poder probarla sin abrir puertos ni conectar a la BD real.
- `node --test` + `tsx` + `mongodb-memory-server`. **82 tests, 13 suites**: auth y roles, recuperación, grupos, sorteo, lista de deseos, estadísticas y correo (Mailjet simulado).
- `tsconfig.build.json` deja los tests fuera de `dist`. Script `test` en la raíz.

**Seguridad y despliegue**
- `controllerError`/`sendOrError`: sin filtración de mensajes internos. Manejador final de errores y 404 en JSON.
- CORS `*` sin credenciales y con aviso en producción. `trust proxy` activo para que el rate limit vea la IP real.
- Subidas SVG deshabilitadas en backend y admin.
- MongoDB: hasta 5 reintentos con espera creciente; si no conecta, el proceso termina (lo verifiqué: sale con código 1 a los ~42 s). `/api/health` responde 503 sin BD.
- Dockerfile del admin con `ARG VITE_API_URL`. Compose con Mongo solo en localhost. nginx con CSP, `Permissions-Policy` y `index.html` sin caché.

**Correo con Mailjet**
- `services/mail.ts` llama a la API v3.1 con `fetch` (sin dependencias nuevas). Modo `log` en desarrollo y tests.
- `services/mailTemplates.ts`: plantilla de recuperación con la marca, en HTML escapado y texto plano.
- Credenciales verificadas con una consulta de solo lectura. Remitente configurado: `panasecreto@erdesarrollo.com.ve` (dominio validado en la cuenta).

**Lista de deseos** (`components/wishlist`)
- Cada miembro tiene un CRUD propio por grupo (máx. 20 deseos) y, tras el sorteo, puede ver la lista de su amigo secreto. Se borra al salir del grupo o al eliminarlo.
- `packages/shared`: `WishSchema`, `CreateWishSchema` y `UpdateWishSchema` (solo URLs http/https).

**Panel admin**
- Nuevo `GET /api/stats` y un dashboard real:
  - KPIs: usuarios, grupos, participaciones y deseos.
  - Registros de los últimos 30 días, con tooltip y vista de tabla.
  - Grupos por estado y usuarios por rol.
  - Próximos intercambios.
- Nuevas páginas **Grupos de Intercambio** (tabla con filtros de búsqueda y estado) y **Detalle de grupo** (datos, miembros, exclusiones y eliminación con confirmación). El panel nunca muestra las asignaciones.
- El cambio de contraseña obligatorio se aplica: no se puede usar el panel hasta completarlo (también afecta al admin semilla).
- Indicador real del estado de la API en la cabecera (en línea / sin BD / sin conexión).
- Revisión visual con Playwright en modo claro y oscuro, escritorio y móvil.

**Limpieza**
- Los roles viven en `packages/shared/src/roles.ts`; backend y admin los importan de ahí.
- README reescrito (estado de módulos, variables de entorno, tests, despliegue). `API_GRUPOS.md` incluye la lista de deseos y las estadísticas.

**Para hacer en tu máquina**
- `pnpm install`: agrega `mongodb-memory-server` (solo para tests). El lockfile ya está actualizado.
- En Coolify: `MJ_APIKEY_PUBLIC`, `MJ_APIKEY_PRIVATE`, `MAIL_FROM_EMAIL`; Build Variable `VITE_API_URL` en el admin; `CORS_ORIGIN` con el dominio del panel.

**Pendiente**
- Chat anónimo (prioridad 5): se hará junto con la app móvil.
- App móvil (prioridad 4).

### 2026-10-20 — Correo real y ESLint

**Prueba de Mailjet**
- Envié un correo real de recuperación a `erick.h.recalde@gmail.com` desde `panasecreto@erdesarrollo.com.ve`. La API de Mailjet lo reporta con estado `sent` (entregado al servidor de destino).

**ESLint** (`pnpm lint` / `pnpm lint:fix`)
- `eslint.config.mjs` único en la raíz (flat config):
  - ESLint 10.12, `@eslint/js` y `typescript-eslint` 8.71.
  - `eslint-plugin-react-hooks` 7.1 (reglas del React Compiler) en el admin y mobile.
  - `react-refresh` en el admin; `globals` según el entorno (Node, navegador, React Native).
- Se permite `any` en los tests; las variables sin usar con prefijo `_` se ignoran.
- Se eliminaron los scripts `lint` de cada paquete, que solo repetían `tsc --noEmit` (eso es `pnpm typecheck`).
- Corregí los 21 errores iniciales:
  - Imports sin usar en el admin y mobile.
  - `setState` dentro de un efecto en `Login.tsx` (ahora es un inicializador perezoso).
  - Asignaciones inútiles.
  - Alias de `this` en el modelo `User`.
  - Tipo `Function` en `sendOrError`.
  - Una expresión ternaria suelta en `DashboardScreen` (mobile).
- Tipé `group/store.ts` (sin `any`, con `FilterQuery<IGroup>` y un tipo `PopulatedUser`).
- Resultado: **0 errores, 60 advertencias** (`any` repartidos y 5 de fast-refresh en los contextos del admin).
- Los tests (82/82), los builds y `tsc` siguen pasando.
- Hay dos conflictos de peers que ya existían y no vienen de ESLint: `multer-storage-cloudinary` pide cloudinary v1 (se usa v2), y `react-dom` 18 del admin convive con React 19 de mobile.

### 2026-10-21 — Imagen en la lista de deseos, cambio de rol, correos, tipado y dependencias

**Dependencias**
- Se eliminó `multer-storage-cloudinary` (pedía cloudinary v1). Nuevo `services/storage.ts`: multer en memoria + SDK oficial de Cloudinary v2 (`upload_stream`), carpetas por tipo (`avatars`, `branding`, `wishlist`), límite de 1600 px, lista blanca de tipos, 8 MB, extracción robusta del `public_id` y modo `mock` para tests. Verificado con una subida y un borrado reales en Cloudinary.
- Mobile tiene ahora su propio `react-dom` 19.2.3, que resuelve el conflicto con el `react-dom` 18 del admin (la dependencia opcional de `expo` tomaba la del admin).
- Auditoría (`pnpm audit --prod`): 3 avisos, todos en herramientas de mobile (`node-forge`, `braces`, `uuid` vía Expo CLI/Metro), sin versión corregida publicada todavía. No afectan al backend ni al admin.

**Imagen en la lista de deseos**
- `POST`/`PATCH /group/:id/wishlist` aceptan `multipart/form-data` con `image`. También `removeImage: true`, y `imageUrl` aparece en las respuestas.
- La membresía se valida antes de aceptar el archivo. Si la operación falla, la imagen subida se borra (sin huérfanas). Al reemplazar, quitar o eliminar un deseo, o al salir o eliminar el grupo, se borran también las imágenes (`wishlist/cleanup.ts`).
- El avatar y la marca usan el mismo servicio; el logo y el favicon reemplazados se borran de Cloudinary. `PATCH /user/me` ya no acepta URLs de foto.

**Cambio de rol en el panel**
- Backend: solo SUPER_ADMIN, nunca sobre el propio usuario (así siempre queda al menos un SUPER_ADMIN), y cierra las sesiones del usuario afectado.
- Panel: el selector de rol se habilita al editar solo para un SUPER_ADMIN sobre otro usuario, con aviso; usa el endpoint `PATCH /user/admin/:id/role`. Verificado con capturas.

**Correos transaccionales (12 plantillas)**
- Bienvenida, cuenta creada por un admin, recuperación, contraseña cambiada, invitación por correo (nuevo `POST /group/:id/invitations`), bienvenida al grupo, aviso al organizador, sorteo realizado, sorteo reiniciado, revelación, expulsión y grupo eliminado.
- Envío en segundo plano y en lotes de 50 (Mailjet v3.1). Nunca a cuentas inactivas, nunca con contraseñas ni asignaciones. Apagado ordenado que espera los envíos pendientes. Nuevas variables `APP_PUBLIC_URL` y `ADMIN_PUBLIC_URL`.

**Tipado estricto**
- Se eliminaron los 46 `any` restantes (backend, admin y mobile) y las 5 advertencias de fast-refresh: los contextos del admin se separaron en `contexts.ts` y hooks propios.
- `no-explicit-any` pasa a **error** y `pnpm lint` corre con `--max-warnings 0`. Resultado: **0 errores, 0 advertencias**.
- De paso: los errores de guardado de usuarios ya no exponen mensajes internos (`describeSaveError`), y Socket.io usa `socket.data` tipado.

**Verificación**
- `tsc` en los 5 paquetes, build del backend y del admin: OK.
- **103/103 tests**: se sumaron imágenes (9), cambio de rol (2) y correos (10).
- Capturas del modal de rol y galería con las 12 plantillas de correo.

**Para hacer en tu máquina:** `pnpm install` (aplica el lockfile actualizado: quita `multer-storage-cloudinary` y agrega ESLint, `mongodb-memory-server` y el `react-dom` de mobile). En Coolify: `APP_PUBLIC_URL` y `ADMIN_PUBLIC_URL`.

### 2026-10-21 — Cambio de marca: PanaSecreto → EntrePanas

Se mantienen colores, tipografías y la paleta (Morado Noche, Amarillo Araguaney…). El logotipo bicolor pasa a **Entre** + **Panas** (la parte en amarillo es «Panas»).

**Cambiado a EntrePanas (todo lo que ve el usuario)**
- **Correos:** las 12 plantillas (encabezado, textos, pie y asuntos), el remitente `EntrePanas <entrepanas@erdesarrollo.com.ve>` (el dominio sigue validado en Mailjet) y los enlaces a `APP_PUBLIC_URL`, con valor por defecto `https://entrepanas.app`.
- **Backend:** nombre de la API (`EntrePanas API`), logs, nombre por defecto en la configuración y carpeta de Cloudinary por defecto (`EntrePanas/…`).
- **Migración automática:** al arrancar, si la configuración guardada sigue con «PanaSecreto», pasa a «EntrePanas». Respeta los nombres personalizados.
- **Panel admin:** título de la pestaña, pie, textos (es/en), nombre por defecto y placeholder de la configuración.
- **App móvil (solo textos):** logotipo del login, registro y recuperación; cabecera de inicio; textos legales; mensaje para compartir por WhatsApp; enlace `https://entrepanas.app/join/…`.
- **App móvil (`app.json`):** `name: "EntrePanas"`, y el paquete Android y el bundle iOS pasan a `com.erdesarrollo.entrepanas`.
- Descripciones de los paquetes, `AGENTS.md`, `.cursorrules`, README y docs. Los contenedores de Docker se llaman `entrepanas-*`.

**Se conserva a propósito (identificadores internos)**
- El repositorio, las carpetas y el scope `@panasecreto/*`, como pediste.
- La base de datos `panasecreto` (cambiarla dejaría los datos existentes atrás).
- El admin semilla `admin@panasecreto.local` (cambiarlo crearía un segundo SUPER_ADMIN en bases ya inicializadas).
- `slug: "panasecreto"` en `app.json`: el `projectId` de EAS y la URL de updates están atados a ese slug. Para cambiarlo hay que renombrar primero el proyecto en expo.dev.
- Los conceptos del juego: «Amigo Secreto», «tu pana secreto», «Registro de Pana» y los códigos `PANA-XXXX-XX`.
- `docs/creargrupo*` (exportaciones de diseño) y el manual de marca en PDF.
- Las imágenes ya subidas siguen en la carpeta `PanaSecreto/` de Cloudinary y funcionan (el borrado usa la URL); las nuevas van a `EntrePanas/`.

### 2026-10-21 — Nueva identidad visual

Reemplaza la paleta anterior (Morado Noche `#1E1338`, Amarillo Araguaney `#F7A800`, Azul Caribe `#1D84B5`, tipografías Inter/Outfit/Epilogue).

- **Recursos:** `assets/logos` y `assets/iconos` en la raíz, con el logo principal y el isotipo. Las 15 piezas del tablero, separadas, están en `docs/identidad/entrepanas`.
- **Ícono de la app:** se genera a partir de `assets/iconos/isotipo-app.png` en 1024×1024: `icon.png`, `adaptive-icon.png` (primer plano al 72 % sobre el amarillo `#FEC414`) y `favicon.png`. El splash usa el logo principal sobre crema. **El original mide 205 px, así que el ícono se ve suave; para publicar en las tiendas hace falta el isotipo en vector o en ≥1024 px.**
- **Tokens (`ui-tokens`):** nueva paleta con `coral` y variantes; tipografía Fredoka + Nunito.
- **App móvil:** `theme.ts` con la nueva paleta y `typography.fontFamily`. Fuentes cargadas en `App.tsx` con `expo-font` y `@expo-google-fonts/{fredoka,nunito}` (funcionan en Expo Go). Se asignó `fontFamily` a los 105 estilos de texto según su peso; los titulares van en Fredoka. El login muestra el logo principal y el resto de pantallas el isotipo (`src/constants/brand.ts` lo toma de `assets/` en la raíz).
- **Panel admin:** Tailwind, Ant Design (claro y oscuro en azul marino), colores por defecto, favicon e isotipo en `AppLogo` (si no hay logo personalizado). Google Fonts Nunito + Fredoka. El Dockerfile ahora copia `assets/`.
- **Backend:** colores por defecto de `SystemConfig`. La migración al arrancar reemplaza solo los colores que sigan en los valores anteriores (respeta los personalizados) y tiene su prueba.
- **Correos:** las 12 plantillas con la nueva paleta y el cuerpo en Nunito (con respaldo Arial). El encabezado es blanco, con el **logo horizontal** (`assets/logos/logo-horizontal-transparente.png`) y una franja amarilla. El logo se sirve desde Cloudinary con un `public_id` fijo (`EntrePanas/branding/email-logo-horizontal`). Se sube con `pnpm --filter @panasecreto/backend mail:logo` (ya está subido; repítelo si cambia el logo) o se reemplaza con `MAIL_LOGO_URL`.
- **Stitch:** nuevo design system «EntrePanas Mobile» (`assets/5129195134007060397`) y nuevas versiones «(Nueva Identidad)» de las 8 pantallas del flujo: Mis Grupos `d3b05617…`, Detalle del Grupo `941ebb50…`, Mi Sobre Abierto `f18fddd4…`, Detalle del Deseo `ac668a3e…`, Mis Deseos `e4497fdf…`, Chats `a22535c8…`, Notificaciones `6a4ff723…`, Perfil `605bf701…`. Las ilustraciones de la mascota dentro de esas pantallas siguen siendo las anteriores, porque Stitch no tiene el arte nuevo.

**Para hacer en tu máquina:** `pnpm install` (agrega `expo-font`, `@expo-google-fonts/fredoka` y `@expo-google-fonts/nunito`).

### 2026-10-21 — App móvil: menú inferior y Detalle del grupo

- **Menú inferior** (`FloatingTabBar`), igual al diseño: Grupos · Chats · Mis deseos · Perfil. Admite contadores (badge coral). El sobre y «mi pana» viven dentro de cada grupo.
- **Detalle del grupo** (`screens/group/GroupDetailScreen.tsx`), con datos de ejemplo en `mocks/groupDetail.ts` y el tipo `GroupDetailView` listo para la API:
  - Encabezado con estado y rol, y pestañas Resumen / Mi sobre / Chat (punto coral si hay mensajes sin leer).
  - **Resumen:** fecha, presupuesto y cupo; lugar del encuentro con «Ver mapa» (Google Maps) y nota; invitación con código, copiar, WhatsApp, correo y link (`expo-clipboard`, compatible con Expo Go); panas confirmados con barra de cupo, menú para quitar panas (organización, antes del sorteo) y «+N panas más»; exclusiones; botón «Hacer el sorteo» (mínimo 3 panas, con confirmación).
  - **Variantes por rol y estado:** quien participa no ve exclusiones ni el menú de cada pana, y antes del sorteo ve «esperando el sorteo». Después del sorteo desaparece la invitación y aparece un acceso a «Mi sobre».
  - Mi sobre y Chat muestran por ahora una tarjeta de «próximo paso».
- Desde Mis Grupos, «Gestionar» abre el detalle, y «Abrir sobre» entra a la pestaña Mi sobre. Se quitó el `Alert` que mostraba el nombre del pana asignado, porque rompía el anonimato.

**Para hacer en tu máquina:** `pnpm install` (agrega `expo-clipboard`).
- **Stitch, diseños nuevos con la identidad 2026:** Mi sobre sellado `f5514bb1…`, Agregar deseo `fa979101…`, Exclusiones `006cab37…`, Unirse con código `f2de0b93…`, Editar grupo `894f9923…`, Editar perfil `f7c3b003…`.

### 2026-10-21 — App móvil: pestaña «Mi sobre»

- `components/envelope/EnvelopeTab` decide el estado:
  - **Bloqueado** (antes del sorteo): explica que el sobre se arma con el sorteo, con un texto según rol.
  - **Sellado:** sobre amarillo con el sello de la guacamaya, «¡Ya te tocó un pana!» y una animación corta al abrirlo (`Animated`, funciona en Expo Go).
  - **Abierto:** cuenta regresiva en vivo (`hooks/useCountdown`), «Le regalas a Pana Incógnito #04» con el presupuesto y la lista de deseos del pana (foto o ícono por categoría, precio, «N comentarios» o «Pregúntale algo»), tip y aviso de anonimato.
  - **Revelado:** «Le regalaste a {nombre}», sin cuenta regresiva.
  - Las tres variantes con sobre muestran la tarjeta de anonimato, los 3 pasos y el presupuesto.
- **Tipos nuevos:** `EnvelopeView` y `WishPreview` (el nombre real solo llega en `revealedName`, cuando el grupo está REVEALED). Hay un mock nuevo, «Panas de la Oficina» (sorteo hecho), y desde Mis Grupos «Abrir sobre» entra a ese grupo.
- **Pendiente en el backend para conectar:** devolver el sobre con alias (no el nombre) antes de REVEALED, registrar que el sobre se abrió y contar los comentarios de cada deseo.

### 2026-10-21 — App móvil: Detalle del deseo con comentarios

- `screens/wish/WishDetailScreen.tsx` (diseño «Detalle del Deseo»):
  - **Tarjeta del deseo:** foto, o ícono de la categoría si no hay, prioridad alta, categoría, precio estimado, tienda sugerida y «Ver en tienda» si tiene enlace.
  - **Hilo anónimo:** aviso de privacidad, comentarios con «hace X» (`utils/format.timeAgo`) y caja fija para escribir con «Le avisaremos por notificación». No es tiempo real.
  - **Sin comentarios:** quien regala ve preguntas rápidas («¿Qué talla usas?», «¿Qué color prefieres?», «¿Alguna marca en especial?»).
- **Dos puntos de vista** (`viewer`):
  - **Quien regala:** «Deseo de Pana Incógnito #04», y sus mensajes salen como «Tú · Tu amigo secreto».
  - **El dueño del deseo:** «Mi deseo», la otra persona aparece como «Tu amigo secreto», y tiene un menú para editar o eliminar (la vista del dueño se usará desde Mis deseos).
- **Navegación:** desde Mi sobre se toca un deseo y se abre su detalle. `App.tsx` guarda los grupos y los deseos de ejemplo, así que al volver se conserva el sobre abierto, la pestaña activa y los comentarios nuevos (con el contador actualizado en la lista).
- **Tipos y mocks:** `WishDetailView`, `WishComment`, `mocks/wishes.ts`. Las categorías (ícono y colores) se movieron a `constants/wishCategories.ts`.
- **Pendiente en el backend:** el modelo y los endpoints de comentarios por deseo, con la notificación al otro lado.

### 2026-10-21 — App móvil: Mis deseos

- `screens/wishes/MyWishesScreen.tsx` (diseño «Mis Deseos»), en la pestaña principal «Mis deseos»:
  - Selector de grupo en chips (punto amarillo si hay preguntas pendientes).
  - Tarjeta de reglas: límite de presupuesto, texto según el estado (antes o después del sorteo) y cupo de 20 deseos con barra de progreso.
  - Botón «+ Agregar deseo» (pasa a «Lista completa» al llegar al tope) y lista vacía con la mascota.
- **Tarjeta de deseo** (`components/myWishes/MyWishCard.tsx`): foto o ícono, «Prioridad», categoría, estrella para marcar prioridad, menú editar/eliminar (con confirmación), precio y tienda. El pie cambia según el caso:
  - **Preguntas sin responder:** franja amarilla con «Responder».
  - **Ya tiene comentarios:** «N comentarios anónimos · Ver comentarios».
  - **Sin comentarios:** «Visible para tu amigo», o «Lista lista para el sorteo» antes del sorteo.
- Al tocar un deseo se abre el Detalle del deseo en la vista del dueño. Al responder, las preguntas pendientes quedan en 0.
- **Navegación:** la barra inferior ya cambia entre Grupos y Mis deseos sin apilar el historial. Chats y Perfil siguen con aviso.
- `components/common/MainHeader.tsx`: el encabezado de las pestañas principales ahora es un componente, compartido por Mis Grupos y Mis deseos.
- **Tipos y mocks:** `MyWish`, `MyWishlistGroup`, `mocks/myWishes.ts` (tres listas: con preguntas, antes del sorteo y vacía).
- **Pendiente en el backend:** `unansweredCount` por deseo (preguntas del amigo secreto sin respuesta del dueño) y el tope de 20 deseos por lista.

### 2026-10-21 — App móvil: Agregar / Editar deseo

- `screens/wishes/WishFormScreen.tsx` (diseño «Agregar deseo»), el mismo formulario para agregar y editar:
  - **Foto obligatoria:** con la cámara o desde la galería (`expo-image-picker`, compatible con Expo Go; pide permisos y tiene recorte 4:3), con vista previa y botones Cambiar/Quitar.
  - **Campos:** nombre (obligatorio, 120 caracteres como en el backend); precio con selector USD/Bs. y aviso en coral si se pasa del presupuesto del grupo; categoría en chips; «¿Dónde se consigue?» (si es un enlace se guarda como URL, si no como tienda); notas de talla y color (500 caracteres, con contador); prioridad Normal o Alta.
  - **Validación al guardar:** errores en los campos y un aviso. «Cancelar» pide confirmación si hay cambios sin guardar.
- **Navegación:**
  - «+ Agregar deseo» en Mis deseos.
  - «Editar deseo» desde el menú de la tarjeta o desde el detalle del deseo (vista del dueño).
  - Eliminar desde el detalle vuelve a la lista.
  - Lo guardado aparece de inmediato en Mis deseos (estado de maqueta en `App.tsx`).
- `app.json`: plugin `expo-image-picker` con los textos de permisos en español (solo aplica a builds; Expo Go ya trae los permisos).
- **Pendiente en el backend:** campos `category` y `storeName` en el modelo `Wish` (hoy existen `title`, `description`, `estimatedPrice`, `currency`, `productUrl`, `imageUrl` e `isFavorite`, que equivale a la prioridad alta).

**Para hacer en tu máquina:** `pnpm install` (agrega `expo-image-picker`).

### 2026-10-21 — App móvil: Chats

- **Lista de Chats** (`screens/chat/ChatsScreen.tsx`, pestaña principal; diseño «Chats»):
  - Contador de grupos activos, tarjeta de anonimato y buscador.
  - Una fila por grupo (`components/chat/ChatRow`): último mensaje firmado con alias, hora (`utils/format.chatTime`), «Tú: {alias}», no leídos en coral o «Nuevo».
  - Los grupos revelados van al final como «Chat archivado».
- **Sala del chat grupal** (`screens/chat/ChatRoomScreen.tsx`):
  - Encabezado «Tú eres {alias} · N panas», banner de identidades protegidas y «Faltan N días para el destape».
  - Burbujas (`components/chat/MessageBubble`): los demás a la izquierda con alias y avatar; los míos a la derecha en azul marino, con «Entregado».
  - «Tirar pista»: el siguiente mensaje sale resaltado como pista para quien te regala.
  - Atajos de emoji. Los grupos revelados quedan en solo lectura.
- **Pestaña Chat del detalle del grupo** (`components/chat/ChatTabPreview`): alias propio, últimos 3 mensajes y «Entrar al chat · N nuevos».
- **Navegación y no leídos:** la barra inferior navega a Chats. Al entrar a una sala se marca como leída. El total de no leídos se muestra como badge en la pestaña Chats en todas las pantallas principales.
- **Tipos y mocks:** `ChatMessage` (con `kind: 'pista'`) y `ChatRoomSummary`, en `mocks/chats.ts`.
- **Pendiente en el backend:** alias por miembro y grupo (distinto del alias del sobre), historial `GET /api/group/:id/chat`, Socket.io por sala (`chat:message`), contador de no leídos y modo solo lectura después de la revelación.

### 2026-10-22 — App móvil: Perfil, Editar perfil y Cambiar contraseña

- **Perfil** (`screens/profile/ProfileScreen.tsx`, pestaña principal; diseño «Perfil»):
  - Encabezado azul marino (barra de estado clara) con avatar (foto o iniciales), botón para cambiar la foto, nombre, correo y estadísticas: grupos, deseos e intercambios.
  - Tarjeta de anonimato.
  - **Cuenta:** Editar perfil y Cambiar contraseña.
  - **Notificaciones:** interruptores de correos y de avisos de comentarios; si alguno está apagado aparece un aviso.
  - **Ayuda:** cómo funciona, términos (`constants/app.TERMS_URL`) y contacto por correo.
  - Cerrar sesión con confirmación y la versión de la app.
- **Editar perfil** (`EditProfileScreen.tsx`):
  - Foto con cámara o galería y recorte 1:1, nombre (obligatorio), apodo, correo de solo lectura y teléfono +58 con formato «412 123 4567» y validación de 10 dígitos.
  - Tarjeta «Blindaje EntrePanas». «Guardar» solo se activa si hay cambios, y al guardar sale «¡Listo el pollo!».
- **Cambiar contraseña** (`ChangePasswordScreen.tsx`):
  - Contraseña actual, nueva con medidor de fuerza (`utils/password.ts`, mínimo 6 como el backend) y confirmación con aviso cuando coinciden. Todos los campos se pueden mostrar u ocultar (`components/profile/PasswordField`).
  - Aclara que la sesión sigue abierta en este teléfono y se cierra en los demás, como hace `/user/change-password`.
- **Reutilizables:** `utils/pickImage.ts` (permisos, cámara o galería, menú de foto, iniciales) y `components/profile/MenuRow` (fila con flecha o interruptor).
- **Navegación:** la pestaña Perfil y el avatar del encabezado llevan al perfil. Al iniciar sesión, el perfil toma el nombre, el correo y el teléfono de la sesión.
- **Pendiente en el backend:** campo `nickname` y preferencias de notificación (`notifyEmail`, `notifyComments`) en el usuario; respetar `notifyEmail` antes de enviar correos.

### 2026-10-22 — App móvil: Notificaciones, Unirse con código, Exclusiones, Editar grupo y El Gran Día

- **Notificaciones** (`screens/notifications/NotificationsScreen.tsx`):
  - Filtros Todas / Comentarios / Grupos (punto coral si hay sin leer), aviso «Tienes N sin leer» y «Marcar todo leído».
  - Agrupadas en Hoy / Esta semana / Antes, con ícono por tipo (`comment`, `reply`, `chat`, `draw`, `join`, `reminder`, `reveal`) y lo que va entre «» resaltado.
  - Al tocar una se marca leída y lleva a su destino: mi deseo, deseo de mi pana, sobre, grupo, chat o revelación.
  - La campana de Mis Grupos, Mis deseos y Chats abre esta pantalla y muestra el punto si hay sin leer.
- **Unirse con código** (`screens/group/JoinGroupScreen.tsx`):
  - Campo con formato automático `PANA-XXXX-XX` y búsqueda (código de prueba `PANA-7K2M-QX`). Si no existe, muestra un error claro.
  - Vista previa del grupo: fecha, presupuesto, lugar, cupos, avatares y aviso de anonimato. Luego «¡Unirme al grupo!» o «No es mi grupo». Si ya eres miembro, ofrece «Ver el grupo».
  - Se abre desde «¿Te llegó un código? · Ingresar» en Mis Grupos.
- **Exclusiones** (`screens/group/ExclusionsScreen.tsx`):
  - Reglas activas con avatares y botón de eliminar. Nueva regla eligiendo dos panas en chips (no deja elegir el mismo ni repetir una regla).
  - Indicador en vivo de si el sorteo sigue siendo posible (`utils/drawFeasibility.ts`, emparejamiento de Kuhn con el mismo criterio del backend). Avisa antes de agregar una regla que lo rompe y no deja guardar si el sorteo es imposible.
- **Editar grupo** (`screens/group/EditGroupScreen.tsx`):
  - Emoji, nombre, fecha DD/MM/AAAA y hora (con máscara y frase de confirmación), presupuesto con moneda, cupo (no baja de los confirmados), lugar con «Revisar en el mapa», nota, y zona de cuidado para eliminar el grupo.
  - Después del sorteo, presupuesto y cupo quedan fijos.
  - Al guardar actualiza el detalle, Mis deseos y Chats (`utils/format.exchangeLabels`).
- **El Gran Día · Revelación** (`screens/group/RevealScreen.tsx`): diseño hecho directamente con la nueva identidad.
  - Encabezado festivo con confeti y «Le regalaste a» (con animación de entrada, el alias que tenía y su lista de deseos).
  - «Te regaló» (con acceso al chat para agradecer) y detalles del encuentro.
  - Se abre desde la notificación o desde «Ver la revelación» en Mi sobre.
- **Detalle del grupo:** el menú, «Editar» del lugar y «Gestionar» de exclusiones ya navegan. Eliminar y salir piden confirmación y quitan el grupo de todas las listas.
- **Tipos y mocks:** `AppNotification`, `JoinPreview`, `GroupReveal`, `exchangeAt` en el grupo, IDs en las exclusiones, `mocks/notifications.ts` y el grupo revelado «Los de la Promo UCAB».
- **Pendiente en el backend:** modelo y endpoints de notificaciones (`GET /api/notifications`, marcar leídas), vista previa por código (`GET /api/group/invite/:code`), exclusiones por ID, revelación (quién me regaló y a quién le regalé) solo cuando el grupo está REVEALED, salir del grupo.

### 2026-10-22 — App móvil: ajustes de la maqueta

- **Calendario propio** (`components/common/CalendarModal.tsx`): mes en español, semana de lunes a domingo, días pasados deshabilitados, hoy marcado y el día elegido en amarillo. Se usa en Crear grupo (reemplaza el modal de fechas fijas; la fecha ahora es obligatoria y se guarda también como ISO en `CreatedGroupDraft.exchangeAt`) y en Editar grupo.
- **Selector de hora** (`components/common/TimePickerModal.tsx`): columnas de hora, minutos de 5 en 5 y AM/PM, con vista previa grande. Se usa en Editar grupo; la fecha y la hora se eligen tocando los campos, sin escribir.
- **Crear grupo › Rango de presupuesto:** la etiqueta «Opcional» se salía de la pantalla porque el texto no cedía espacio; se corrigió (`cardHeaderText` con `flex: 1`).
- **Alertas y confirmaciones propias** (`components/common/AppDialog.tsx`): `Alert.alert(título, mensaje, botones)` con la misma firma que React Native, pero con el diseño de la app:
  - Mascota arriba (advertencia roja en confirmaciones destructivas), botón principal amarillo, cancelar en gris y destructivo en rojo.
  - Hasta 2 botones van en fila; con más, se apilan (menú de foto).
  - Usa una cola para que los diálogos encadenados no se pisen. El host `<AppDialogHost />` va montado en `App.tsx`.
  - Las 17 pantallas y componentes que usaban el `Alert` nativo ahora importan este. Se quitó el `Alert.prompt` (solo iOS) de Mis Grupos.
- **Términos y condiciones** y **Política de privacidad**, por separado y dentro de la app (`screens/legal/LegalScreen.tsx`, textos en `constants/legal.ts`). Son un borrador base que conviene revisar con un abogado antes de publicar.
- **Contáctanos:** hoja inferior (`components/profile/ContactModal.tsx`) con nombre, correo y teléfono del contacto (`constants/app.CONTACT`); toca para escribir, llamar o abrir WhatsApp. El teléfono queda vacío hasta que se complete.
- **Contacto:** teléfono 0414-316 8556 (`+584143168556`), con opciones para llamar y abrir WhatsApp en Contáctanos.
- **Mis deseos › «Lista de mi pana»:** selector «Mi lista / Lista de mi pana» en cada grupo (`components/myWishes/PanaWishlistPanel.tsx`):
  - Antes del sorteo explica que la lista aparecerá después.
  - Con el sobre cerrado ofrece «Abrir mi sobre».
  - Con el sobre abierto muestra el alias de tu pana y su lista; cada deseo abre el detalle con los comentarios anónimos.
  - Así se llega a lo que quiere tu pana sin tener que entrar por el grupo.
- **Pestaña «Mis deseos» → «Deseos»** (menú inferior, título de la pantalla y textos de la app), porque ahora reúne tu lista y la de tu pana.

### 2026-10-22 — Backend: todo lo pendiente tras la maqueta

- **Anonimato:** el sobre y la lista de tu pana solo devuelven su alias hasta la revelación; los deseos ya no exponen el `userId` del dueño.
- **Campos nuevos:** lugar y nota del grupo; `myAlias`, `envelopeOpened` en detalle y Mis grupos; vista previa con iniciales; `category` y `storeName` en los deseos; `nickname`, `gender`, `notifyEmail`, `notifyComments` en el usuario (los correos de grupo respetan `notifyEmail`).
- **Alias** (`components/alias`): catálogo de 300 alias con emoji (100 por género), 5 sugerencias al azar, alias propio con filtro de groserías (`utils/badWords.ts`), único en el grupo, bloqueado tras el sorteo y asignado automáticamente a quien no eligió. Administración del catálogo y de los alias propios.
- **Tips** (`components/tip`): 42 tips iniciales por pantalla, endpoint público aleatorio ponderado y administración.
- **Sobre y revelación:** `POST /envelope/open` y `GET /reveal`.
- **Comentarios anónimos** (`components/comment`): hilo privado dueño ↔ quien regala, contadores en las listas, aviso en la app y correo nuevo (`wishCommentEmail`).
- **Notificaciones en la app** (`components/notification`): campana con no leídos, marcar leídas, avisos de sorteo, unión, revelación, comentarios y pistas, y recordatorios cada hora (`services/reminders.ts`).
- **Chat** (`components/chat`, `sockets/`): historial paginado, envío por REST o Socket.io (`chat:join`, `chat:send` con ack, `chat:message`), no leídos, lista de chats, antispam y solo lectura tras revelar. El servidor de sockets ahora se crea con `createSocketServer()` y también se monta en las pruebas.
- **Limpieza:** comentarios, chat y notificaciones se borran con el grupo; los comentarios, al deshacer el sorteo o borrar el deseo.
- **Pruebas:** `src/test/engagement.test.ts` (alias, sobre, comentarios, notificaciones, recordatorios, chat REST y sockets, revelación, catálogos) y `utils/badWords.test.ts`; se actualizaron las de grupos y deseos al sobre por alias. Total: 158 pruebas en verde, `tsc` y ESLint sin errores. Se agregó `socket.io-client` como dependencia de desarrollo del backend (ya estaba en el lockfile).
- **Pendiente para la app y el panel:** conectar estos endpoints (ver `docs/PENDIENTES.md`).

### 2026-10-22 — Panel web: alias, tips y campos nuevos

- **Menú:** nuevas secciones «Alias» (`/aliases`) y «Tips» (`/tips`), solo para ADMIN y SUPER_ADMIN.
- **Alias:** tarjetas por género, catálogo con filtros y activar/desactivar en línea, formulario (alias, emoji, género, activo), importación masiva y pestaña de alias propios con marca de posibles groserías y opción de quitarlos.
- **Tips:** listado con filtros y conteo por pantalla, aviso de pantallas sin tips, formulario con vista previa en vivo (mascota + «¡Tip del pana!») y panel que muestra lo que recibe la app en cada pantalla.
- **Grupos:** lugar con enlace a Google Maps, nota, estado del alias por miembro y apodo.
- **Usuarios:** apodo, género y preferencias de correo.
- **Código:** `api/catalogs.ts`, `types/catalogs.ts`, `components/catalogs/{TipBubble,GenderTag}.tsx`, `utils/aliasImport.ts`; textos en español e inglés.
- **Verificación:** `tsc` y ESLint sin errores, `vite build` correcto y capturas de cada pantalla con datos simulados (escritorio y móvil).

### 2026-10-22 — App móvil: autenticación real y «Continuar con Google»

- **Backend:**
  - Login, registro y Google devuelven la misma sesión (`sessionPayload`), ahora con apodo, género, preferencias, `hasPassword` y `googleLinked`. El registro acepta `nickname` y avisa con `EMAIL_TAKEN` (y si el correo ya es de Google).
  - Google por navegador sin dependencias nuevas (`services/google.ts`): `GET /google/start` → Google → `GET /google/callback` → regreso a la app con un ticket de un solo uso (`AuthTicket`, TTL 5 min) → `POST /google/exchange`. Verifica la firma del ID token con las claves de Google (JWKS en caché), emisor, audiencia y nonce.
  - `POST /google` con ID token directo y `GET /google/config`.
  - Cuentas nuevas de Google: `USER`, foto de Google, `hasPassword: false`; si el correo ya existía, se vincula. Las cuentas desactivadas no entran. Cambiar contraseña no pide la actual si la cuenta no tenía.
  - Variables nuevas: `API_PUBLIC_URL`, `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_WEB_CLIENT_SECRET`, `GOOGLE_EXTRA_CLIENT_IDS`, `GOOGLE_APP_REDIRECT_SCHEMES`.
  - Pruebas: `src/test/google.test.ts` simula Google con claves RSA propias (cuenta nueva, vinculación, ticket de un solo uso, nonce falso, audiencia ajena, correo sin verificar, cancelación, state falso, cuenta desactivada, crear contraseña). Total: 166 pruebas en verde.
- **App:**
  - `src/api/{config,client,auth}.ts`: URL de la API (`EXPO_PUBLIC_API_URL` o la IP de Metro), cliente `fetch` con token, tiempo límite, errores normalizados (`ApiError` con mensaje y errores por campo) y cierre automático ante un 401.
  - `src/auth/{AuthContext.tsx,storage.ts,google.ts}`: sesión en `expo-secure-store`, restauración al abrir (con pantalla de carga y modo sin conexión), `signIn`/`signOut`, y Google con `expo-web-browser` + `expo-linking`.
  - Login: correo (antes decía «Correo o usuario»), errores en el campo, aviso de sesión vencida y Google funcionando. Registro: nombre y apellido se separan, el usuario pasa a ser «Apodo» (opcional), teléfono con +58, reglas de contraseña (8 caracteres y un número), enlaces a Términos y Privacidad, y Google. Recuperación: código real, reenviar a los 60 s, código de prueba en desarrollo, y entra sola con la nueva clave.
  - `App.tsx`: pila de autenticación separada de la de la app; el perfil y el saludo del inicio salen del usuario real.
  - Dependencias nuevas (solo en el lockfile): `expo-secure-store`, `expo-web-browser`, `expo-linking`, `expo-constants`. `app.json` con `scheme: "entrepanas"`.
  - Verificación: `tsc` y ESLint sin errores; recorrido completo en el navegador con la API simulada (login malo y bueno, sesión restaurada, registro con correo repetido y bueno, recuperación, Google).

### 2026-10-22 — App móvil: inicio (Mis Grupos) conectado a la API

- **Backend:** `GET /api/group` agrega a cada grupo `memberPreview` (iniciales o foto de los primeros 4, sin correo ni ID), `locationName`, `drawnAt`, `revealedAt` y `completedAt`. Prueba nueva en `group.test.ts`.
- **App:**
  - `src/api/queryStore.ts`: caché mínima de consultas (`useApiQuery`, sin dependencias): muestra al instante lo último cargado, refresca por detrás, comparte datos entre pantallas y se limpia al cerrar o abrir sesión.
  - `src/api/{groups,badges,tips}.ts`: mis grupos, no leídos (campana y chats) y tips por pantalla.
  - `DashboardScreen`: «Mis Grupos» (organizo) y «Participo» con conteos reales, ordenados por fecha del intercambio (finalizados al final); deslizar para refrescar; tarjetas de carga, lista vacía con acción (crear o unirse) y error con «Reintentar».
  - `components/dashboard/GroupCard.tsx`: una tarjeta por etapa. En espera: presupuesto, lugar o fecha, panas X de Y, avatares y aviso «Elige tu alias». Sorteado: sobre sellado o abierto con cuenta regresiva. Revelado: «¡Llegó el destape!». Finalizado: histórico.
  - Tip del Guaca: tips reales de la pantalla `grupos` (la flecha pasa al siguiente). Campana y badge de Chats con datos reales en todas las pestañas. El avatar del encabezado usa la foto del usuario.
  - Se quitaron los datos fijos y el botón «Revivir este año» (no hay función en la API todavía). Tocar un grupo real avisa que el detalle se conecta en el siguiente paso.
- **Verificación:** `tsc` y ESLint sin errores; pruebas de grupos, deseos e interacción en verde; capturas con la API simulada (listas, carga, vacía y error).

### 2026-10-22 — App móvil: crear grupo y detalle del grupo conectados

- **Crear grupo:** `POST /api/group` con nombre (ya no viene precargado), ícono del grupo (10 emojis), fecha del calendario a las 7:00 PM (la hora se cambia en Editar grupo), moneda, presupuesto (validado: números, mínimo ≤ máximo, o «sin límite»), cupo y pistas anónimas. El modal de éxito muestra el código real, copia de verdad el código y el enlace (`expo-clipboard`) y ofrece «Ver mi grupo».
- **Detalle del grupo** (`screens/group/GroupScreens.tsx`): contenedores que cargan el grupo con `GET /api/group/:id` y, según la etapa, el sobre (`/assignment`), la lista del pana (`/wishlist/assigned`) y la revelación (`/reveal`). `adapters/groupView.ts` convierte la respuesta a la vista que ya usaban las pantallas, así que el diseño no cambió.
  - Resumen: datos reales, lugar y nota, código de invitación, panas (organizador primero, «tú», se unió hace…, alias listo / sin alias), exclusiones como parejas y deslizar para recargar.
  - Acciones con indicador de «trabajando» y mensajes claros: sortear (con aviso si faltan panas o si las exclusiones lo impiden), deshacer el sorteo, revelar, finalizar, quitar a un pana, salir y eliminar. Después de cada acción se recargan el grupo y el inicio.
  - Mi sobre: sellado → «Abrir mi sobre» lo registra en el servidor → alias del pana y su lista de deseos reales.
  - Editar grupo: envía solo lo que cambió (presupuesto, moneda y cupo solo antes del sorteo, como exige la API). Exclusiones: cada pareja es mutua y se guarda por miembro; avisa si el sorteo deja de ser posible. El Gran Día: a quién le regalé y quién me regaló.
  - `GroupDetailScreen` quedó controlado (sin datos de ejemplo); `ApiError` guarda el cuerpo completo (p. ej. `blockedMembers`).
  - Todavía con maqueta: el chat del grupo y el detalle de un deseo (avisan que se conectan en el siguiente paso).
- **Verificación:** `tsc` y ESLint sin errores. Recorrido completo en el navegador con respuestas reales del backend (capturadas con un servidor de prueba): crear → ver grupo → sortear → abrir el sobre.

### 2026-10-22 — App móvil: alias, unirse con código y lista de deseos conectados

- **Alias** (`components/alias/AliasPickerModal.tsx`, `AliasCard.tsx`): 5 sugerencias del servidor según el género del perfil, con pestañas Masculinos / Femeninos / Neutros, «Ver otras 5» sin repetir (al agotarse vuelve a empezar), o «Escribir el mío» con emoji. Errores del servidor (repetido, grosería, bloqueado tras el sorteo) en la misma hoja. Se abre sola al crear un grupo o unirse, desde «Elige tu alias» en el inicio y desde la tarjeta «Tu alias en este grupo» del detalle (solo lectura después del sorteo).
- **Unirse con código:** vista previa real (`GET /api/group/code/:code`), avisa si ya eres miembro, si el grupo está lleno o ya se sorteó, y al entrar abre el grupo con la elección del alias.
- **Deseos** (`screens/wishes/WishScreens.tsx`): chips con los grupos reales, mi lista del grupo elegido (`/wishlist/me`), prioridad alta (= favorito), eliminar, deslizar para recargar, y «Lista de mi pana» con el sobre real.
- **Agregar / editar deseo:** con foto nueva se envía multipart (la foto sube a Cloudinary); sin foto nueva, JSON. Campos: nombre, precio y moneda, categoría, tienda o enlace, notas y prioridad. Avisa si la lista está llena o la foto pesa más de 8 MB.
- **Detalle del deseo:** el dueño y quien regala ven el mismo hilo (`/comments`); enviar comentario actualiza el hilo y los contadores. Antes del sorteo o con el intercambio finalizado, el cuadro de texto se reemplaza por el motivo.
- **Backend:** `GET /api/group` agrega `myWishCount` (usado en las estadísticas del perfil). Prueba nueva en `wishlist.test.ts`.
- **App:** el cliente HTTP acepta `FormData`; el detalle del grupo guarda 10 s en caché para no recargar todo al volver. Se quitaron de `App.tsx` los datos de ejemplo de grupos, deseos y comentarios (los archivos de `src/mocks` siguen para chat y notificaciones).
- **Verificación:** `tsc` y ESLint sin errores; pruebas de grupos, deseos e interacción en verde; recorrido en el navegador con respuestas reales del backend: unirse → elegir alias → Deseos → agregar con foto → detalle (dueño), y quien regala: abrir el sobre → deseo → comentar → Lista de mi pana.

### 2026-10-26 — App móvil: perfil, tips y enlaces de invitación

- **Perfil** (`screens/profile/ProfileContainers.tsx`, `api/profile.ts`):
  - Editar perfil guarda nombre y apellido, apodo y teléfono con `PATCH /api/user/me`; si cambió la foto, la sube (`POST /api/user/upload`) o la quita.
  - En la pestaña Perfil, la foto y los avisos se guardan al instante (si falla, vuelven como estaban y se avisa).
  - Cambiar contraseña con `POST /api/user/change-password`; si la contraseña actual no coincide, el error sale bajo ese campo. Las cuentas de Google ven «Crear contraseña» sin el campo de la actual.
  - Registro: la cámara del avatar ya no dice «Próximamente»; la foto elegida se sube justo después de crear la cuenta.
- **Backend:** `DELETE /api/user/photo` quita la foto y la borra de Cloudinary. Página pública `GET /join/:code` (`routes/invite.routes.ts`) con el código y el botón «Abrir en la app»; variable nueva `APP_LINK_BASE`. Pruebas en `test/profile.test.ts`.
- **Tips:** `hooks/useTip.ts` y `components/common/TipCard.tsx`; un tip al azar por visita (caché de 30 min), tocar muestra otro.
- **Enlaces de invitación:** `inviteLink` usa `<API_URL>/join/CODIGO` (o `EXPO_PUBLIC_INVITE_URL`). La app escucha `expo-linking` (al abrir y con la app abierta) y entiende `entrepanas://join/…`, `exp://…/--/join/…` y `https://…/join/…` (`utils/deepLink.ts`).
- **Verificación:** `tsc` (app y backend) y ESLint sin errores; todas las pruebas del backend en verde; recorrido en el navegador: perfil de cuenta Google → apagar avisos → crear contraseña; editar perfil; enlace con y sin sesión; tips en Chats.

### 2026-10-26 — Notificaciones en la app y push con Expo

- **Backend:**
  - Colección `PushToken` y `POST/DELETE /api/push/token`. Cada notificación nueva de la campana sale también como push por Expo (`services/push.ts`), con su destino en `data` y el número de no leídas como `badge`.
  - Se respeta `notifyPush` (nuevo en el usuario), `notifyComments` para comentarios, respuestas y chat, y no se mandan recordatorios como push de 9 p. m. a 8 a. m.
  - Los tokens que Expo reporta como no registrados se borran; «Cerrar todas las sesiones» quita los teléfonos de la cuenta.
  - Panel: «Notificaciones push» en las preferencias del usuario. Pruebas en `test/push.test.ts`.
- **App:**
  - Pantalla Notificaciones con datos reales (`NotificationsContainer`): nombre del grupo, marcar todo leído, tocar = leída + destino, mantener presionada = borrar, deslizar para recargar, estados de carga, error y vacío. Se quitó `mocks/notifications.ts`.
  - `useNotificationSync`: consulta cada minuto con la app abierta y al volver a ella; registra el teléfono para push; al tocar una push abre su destino (también con la app cerrada).
  - `expo-notifications` y `expo-device` (canal «Avisos de EntrePanas», ícono `assets/notification-icon.png`). En Expo Go Android el módulo no se carga y todo sigue por consulta.
  - Perfil: interruptor «Notificaciones push». Al cerrar sesión el teléfono deja de recibir push de la cuenta.
  - `eas.json` con el perfil `preview` (APK) para probar las push.
- **Verificación:** `tsc` (app, backend y panel) y ESLint sin errores; todas las pruebas del backend en verde (8 nuevas de push); recorrido en el navegador: lista, filtros, marcar todo leído, borrar, tocar → destino, interruptor de push.

### 2026-10-26 — Chat del grupo en tiempo real y limpieza final

- **Conexión** (`api/socket.ts`): una sola conexión Socket.io (solo WebSocket) con el JWT de la sesión; se abre al entrar y se cierra al salir. Al reconectarse vuelve a entrar a las salas. Si la sesión se revocó, deja de reintentar.
- **Sincronización** (`hooks/useChatSync.ts`): entra a las salas de todos mis grupos; cada mensaje nuevo actualiza la sala, la lista (último mensaje, orden) y los no leídos de la barra inferior. Si la sala está abierta, se marca leída al instante. Al volver a la app la lista se recarga.
- **Pantallas** (`screens/chat/ChatScreens.tsx`):
  - Lista de chats real con carga, error, vacío y deslizar para recargar.
  - Sala: últimos 50 mensajes y «Ver mensajes anteriores»; envío por socket con confirmación (y por REST si no hay conexión en vivo); el mensaje sale al instante como «Enviando…».
  - Pistas solo si el grupo las tiene activas y ya hubo sorteo (antes: «Las pistas se activan después del sorteo»).
  - Sin alias: «Elige tu alias para escribir» (abre el grupo con la elección). Después de la revelación: solo lectura.
  - Errores del servidor con su mensaje: antispam, chat cerrado, falta alias, pistas apagadas o sin sorteo; el texto vuelve al cuadro.
  - Aviso «Reconectando…» mientras se recupera el tiempo real.
  - Pestaña Chat del detalle del grupo con los últimos 3 mensajes reales y los no leídos. Las notificaciones y push de pistas abren la sala.
- **Limpieza:** se borró `src/mocks` (chats, grupos, deseos, perfil), los avisos «Próximamente» del detalle del grupo, estilos sin uso y comentarios de la maqueta.
- **Dependencia:** `socket.io-client` en la app (hay que correr `pnpm install`).
- **Verificación:** `tsc` y ESLint sin errores; recorrido en el navegador contra un servidor simulado con el mismo contrato REST y socket del backend: lista → mensaje en vivo de otro pana (no leído +1) → sala → enviar → pista recibida y enviada → antispam → anteriores → sin alias → archivado → pestaña Chat del grupo.

### 2026-10-27 — Panel: avisos push a usuarios

- **Backend:** `PushCampaign` (historial) y rutas de administración en `/api/push/admin` (estadísticas, alcance, enviar, historial). Se envía solo a cuentas activas con push encendidas y teléfono registrado. Con «también en la campana» se crea la notificación (tipo nuevo `announcement`) para todos los elegidos y la push lleva su id para marcarla leída. Pruebas en `test/push-admin.test.ts`.
- **Panel:** página «Notificaciones push» con tarjetas de resumen, destinatarios (todos / grupo / usuarios con buscador), título y mensaje con contador, vista previa en un teléfono, alcance antes de enviar, confirmación e historial. Botones de acceso directo en el detalle de usuario y de grupo.
- **App:** las notificaciones `announcement` tienen ícono propio; una push sin grupo abre Notificaciones.
- **Verificación:** `tsc` (backend, panel y app) y ESLint sin errores; todas las pruebas del backend en verde (6 nuevas); recorrido en el navegador del panel compilado con respuestas simuladas (escritorio y celular).

