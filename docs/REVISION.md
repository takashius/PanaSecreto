# Revisión del proyecto PanaSecreto

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
- [ ] 🟠 **Recuperación de contraseña débil.** _(parcial: ✅ `crypto.randomInt`, ✅ `devCode` solo en development/test, ✅ contador de 5 intentos por cuenta. Pendiente: envío por correo y pasar el paso 1 a `POST`.)_
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
- [ ] 🟡 _(parcial: ✅ `sendOrError` ya respeta los 4xx (409/422) y responde 500 genérico registrando el detalle en el servidor)_ `controllerError` devuelve mensajes internos (`err.message`) al cliente con estado 400, y `sendOrError` manda los 500 por ahí, así que terminan respondiendo 400.
- [ ] 🟡 Con `CORS_ORIGIN=*` se reflejan todos los orígenes con `credentials: true`.
- [ ] 🟡 Se permiten subidas SVG (posible XSS si se sirven directamente).
- [ ] 🟡 El admin web no obliga el flujo de `forcePasswordChangeOnNextLogin`: el usuario puede navegar a otras rutas.

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
- [ ] 🟡 Wishlist (`gift.schema.ts`) definida, sin modelo ni rutas.

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

- [ ] 🟠 El Dockerfile del admin no recibe `VITE_API_URL` como `ARG`, así que el build de producción apunta a `http://localhost:4000`.
- [ ] 🟠 El backend arranca aunque Mongo falle ("modo degradado") y las peticiones se quedan colgadas en el buffer de Mongoose. Hay que fallar rápido o desactivar `bufferCommands`.
- [ ] 🟡 `docker-compose.yml` usa `CORS_ORIGIN: "*"` y expone Mongo en `27017` sin autenticación.
- [ ] 🟡 `nginx.conf` sin `Content-Security-Policy`; `X-XSS-Protection` está obsoleto.

## Deuda técnica y consistencia

- [ ] 🟡 Código muerto _(parcial: ✅ eliminados `config/index.ts`, `models/user.model.ts`, `models/group.model.ts` y `routes/group.routes.ts`; queda `admin/src/App.tsx`)_:
  - `backend/src/config/index.ts` (config duplicada).
  - `backend/src/models/user.model.ts` (segundo modelo `User`, provocaría `OverwriteModelError`).
  - `admin/src/App.tsx` (maqueta vieja).
- [ ] 🟡 El README dice Expo SDK 52 (es 57) y no documenta las variables de Cloudinary ni `USER_ADMIN_*`.
- [ ] 🟡 `.cursorrules` dice que solo SUPER_ADMIN/ADMIN entran al panel, pero el código también deja entrar a ORGANIZER.
- [ ] 🟡 El `background` del admin en Tailwind (`#F5F5F5`) no coincide con el token (`#F8F9FA`).
- [ ] 🟡 Los roles están duplicados entre backend y admin; deberían vivir en `packages/shared`.
- [ ] 🟡 Rutas duplicadas (`/user` y `/api/user`, `/upload` y `/me/photo`, `/logout` y `/me/logout`).
- [ ] 🟡 No hay tests ni lint (`lint` = `tsc --noEmit`). Añadir Vitest/Jest + Supertest y ESLint.
- [ ] 🟡 Textos de la UI "replicada desde UniSan" visibles en el dashboard del admin y en la ruta `/` de la API.

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
