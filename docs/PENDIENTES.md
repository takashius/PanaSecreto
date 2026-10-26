# Pendientes de EntrePanas

Lista viva de lo que falta después de maquetar la app móvil (22 de octubre de 2026). El detalle de cada pantalla está en `docs/REVISION.md`.

---

## Backend

**Completado el 22/10/2026** (detalle de endpoints en `docs/API_GRUPOS.md`; 158 pruebas automáticas en verde).

### 1. Anonimato
- [x] `GET /group/:id/assignment` y `GET /group/:id/wishlist/assigned` devuelven solo el **alias** de tu pana (y sus deseos sin el ID del dueño) hasta que el grupo esté `REVEALED`; al revelar llegan nombre, foto e ID.

### 2. Campos que faltaban
- [x] **Grupo:** `location {name, address}` y `note` (crear, editar, detalle y vista previa). El detalle trae `myAlias`, `myAliasEmoji` y `envelopeOpened`; «Mis grupos» también.
- [x] **Vista previa por código:** descripción, lugar, nota, fecha y hora, e iniciales/foto de hasta 12 miembros.
- [x] **Deseo:** `category` (ropa, tecnologia, hogar, dulces, libros, otro) y `storeName`, también por multipart. El tope de 20 deseos ya existía.
- [x] **Usuario:** `nickname`, `gender` (M/F/N), `notifyEmail` y `notifyComments`. Los correos de grupo respetan `notifyEmail` (los de seguridad siempre se envían).

### 3. Funciones nuevas
- [x] **Abrir el sobre:** `POST /group/:id/envelope/open` (idempotente; se borra si se deshace el sorteo).
- [x] **Comentarios por deseo:** `GET`/`POST /group/:id/wishlist/:wishId/comments`.
  - Solo el dueño del deseo y quien le regala; para los demás el deseo «no existe» (404). Se abren tras el sorteo y se cierran al finalizar.
  - Nunca viaja el autor: `author: me|other` y `authorRole: owner|giver`.
  - `commentsCount` y `unansweredCount` en «Mi lista» y en «Lista de mi pana».
  - Aviso en la app al otro lado y correo nuevo (respeta `notifyEmail` + `notifyComments`).
  - Se borran al eliminar el deseo, al deshacer el sorteo, al expulsar al miembro y al eliminar el grupo.
- [x] **Notificaciones en la app:** `GET /api/notifications` (`?unread=true&groupId=`), `GET /api/notifications/unread-count`, `POST /api/notifications/:id/read`, `POST /api/notifications/read-all`, `DELETE /api/notifications/:id`.
  - Se crean con: comentario, respuesta, sorteo, sorteo deshecho, alguien se une (al organizador), revelación y pistas del chat (máx. una por hora y grupo).
  - Recordatorios cada hora (`runReminders`), sin duplicados: faltan 3 días / mañana, sobre sin abrir 24 h después del sorteo, lista vacía y alias sin elegir a una semana del intercambio.
  - Se borran solas a los 90 días.
- [x] **Chat grupal:**
  - REST: `GET /group/:id/chat` (paginado con `before` y `limit`), `POST /group/:id/chat`, `POST /group/:id/chat/read` y `GET /api/chat` (lista de chats con último mensaje y no leídos).
  - Socket.io autenticado con el JWT: `chat:join`, `chat:leave`, `chat:send` (con ack), `chat:read` y el evento `chat:message` a la sala del grupo.
  - Los mensajes solo llevan alias (nunca el usuario); `mine` solo en el historial propio y en el ack.
  - Tipos `mensaje` y `pista` (pistas solo después del sorteo y si el grupo las permite), antispam de 20 mensajes por minuto y solo lectura después de la revelación.
- [x] **Revelación:** `GET /group/:id/reveal` → `giftedTo` y `giftedBy` (solo con el grupo `REVEALED` o `COMPLETED`).

### 4. Alias
- [x] **Decisión:** un solo alias por persona y grupo, usado en el sobre, el chat y los comentarios (así las pistas del chat le sirven a quien regala).
- [x] **Catálogo** `AliasSuggestion` con **300 alias** (100 masculinos, 100 femeninos, 100 neutros, con emoji y tono venezolano). Se siembra solo si la colección está vacía.
- [x] `GET /group/:id/alias/suggestions?gender=&exclude=` → 5 al azar del género de la persona (o el que pida) más neutros, sin repetir los ya vistos ni los usados en el grupo.
- [x] `PUT /group/:id/members/me/alias` → `{alias, emoji?}`: 3 a 30 caracteres, único en el grupo, filtro de groserías (con disfraces tipo «m4mague vo») y bloqueado después del sorteo.
- [x] Quien no elija recibe uno del catálogo al hacer el sorteo, según su género y sin repetir.
- [x] Administración: `GET/POST /api/alias/admin`, `PATCH/DELETE /api/alias/admin/:id`, `GET /api/alias/admin/custom` (alias propios, marcados si parecen ofensivos) y `DELETE /api/alias/admin/custom/:groupId/:userId` (quitarlo).

### 5. Tips rotativos
- [x] Modelo `Tip` (texto, pantallas, activo, peso 1 a 5) con **42 tips** iniciales: los de la app más nuevos por pantalla.
- [x] `GET /api/tips?screen=&general=&limit=` (público): tips activos de esa pantalla más los generales, barajados al azar con peso.
- [x] Administración: `GET/POST /api/tips/admin` (con conteo de tips activos por pantalla) y `PATCH/DELETE /api/tips/admin/:id`.
- Pantallas: `general`, `grupos`, `grupo.resumen`, `sobre.sellado`, `sobre.lista`, `deseo.detalle`, `deseo.formulario`, `deseos`, `chat.lista`, `chat.sala`, `notificaciones`, `unirse`, `exclusiones`, `revelacion`.

### Queda para después
- [ ] Notificaciones push (Expo) además de las de la app.
- [ ] Reportar mensajes o comentarios y moderarlos desde el panel.

---

## Panel administrativo (web)

**Completado el 22/10/2026** (menú lateral: «Alias» y «Tips»).

- [x] **Alias** (`pages/aliases`):
  - Tarjetas por género (total y activos) que también filtran.
  - Catálogo con búsqueda, filtro por género y estado, activar/desactivar en la misma fila, crear, editar y eliminar.
  - Importación masiva: un alias por línea (`Texto|emoji`), con el género elegido; muestra cuáles se omiten y cuáles ya existían.
  - Pestaña «Alias propios»: lo que escribieron los usuarios, con usuario, grupo y estado; los que parecen ofensivos salen marcados y se pueden quitar.
- [x] **Tips** (`pages/tips`):
  - Listado con búsqueda y filtro por pantalla (con cuántos tips activos tiene cada una) y estado; aviso de las pantallas que no tienen tips propios.
  - Crear y editar con vista previa en vivo del globo «¡Tip del pana!», pantallas por casillas, peso de 1 a 5 y activo.
  - Panel «Vista previa en la app»: elige una pantalla y muestra lo mismo que recibirá la app, con un botón «Otro».
  - El «tipo» se resolvió con la pantalla `general`: un tip es general si tiene esa pantalla.
- [x] **Grupos:** lugar del encuentro (con enlace al mapa) y nota en el detalle; columna «Alias» con elegido/pendiente (sin mostrar cuál, por anonimato) y apodo junto al nombre.
- [x] **Usuarios:** apodo y género en el detalle, y tarjeta «Preferencias en la app» con los correos encendidos o apagados (solo lectura: las cambia la persona).
- [ ] **Opcional:** moderación de comentarios y mensajes del chat reportados (falta también en el backend).

---

## App móvil

- [x] **Elegir alias:** hoja con las 5 sugerencias, «Ver otras 5» y «Escribir el mío». Se abre al unirse a un grupo o al crearlo, desde el aviso del inicio y desde «Tu alias» en el detalle.
- [x] **Tips (26/10/2026):** `TipCard` + `useTip` muestran un tip al azar del servidor (tocar = otro) en Mi sobre (sellado y abierto), Detalle del deseo, Agregar deseo, Deseos, Chats, Notificaciones, Unirse, Exclusiones y El Gran Día. Sin red usan un texto de respaldo.
- [x] **Autenticación conectada (22/10/2026):** registro, inicio de sesión, recuperar contraseña, sesión guardada en el teléfono (`expo-secure-store`), cierre de sesión y «Continuar con Google» (ver `docs/AUTENTICACION.md`).
- [x] **Google:** cliente OAuth creado y variables cargadas en Coolify; funciona en producción.
- [x] **Perfil (26/10/2026):** editar nombre, apodo y teléfono; subir o quitar la foto (`DELETE /api/user/photo`, nuevo); interruptores de avisos; cambiar contraseña, o crearla si la cuenta es de Google. La foto también se puede elegir al registrarse.
- [x] **Enlaces de invitación (26/10/2026):** el enlace que se comparte es `<API_PUBLIC_URL>/join/PANA-XXXX-XX`; esa página abre la app con `APP_LINK_BASE` (`entrepanas://` o, con Expo Go, `exp://IP:8081/--/`). La app abre «Unirse» con el código ya buscado; sin sesión, pide entrar primero.
  - [ ] Con la app instalada (build propio): enlaces https verificados (App Links / Universal Links) para abrir sin pasar por la página.
- [ ] **Conectar con la API:**
  - [x] Cliente HTTP (`src/api/client.ts`), sesión guardada en el teléfono y manejo de errores.
  - [x] Inicio (Mis Grupos): grupos reales, campana y chats con no leídos reales, tips de la pantalla `grupos` (22/10/2026).
  - [x] Crear grupo, detalle del grupo (Resumen y Mi sobre), editar, exclusiones, sortear, deshacer, revelar, finalizar, quitar panas, salir, eliminar y El Gran Día (22/10/2026).
  - [x] Elegir alias (5 sugerencias, «Ver otras 5», escribir el propio), unirse con código, Deseos (mi lista y la de mi pana), agregar/editar deseo con foto, prioridad, eliminar y detalle del deseo con comentarios anónimos (22/10/2026).
  - [x] Perfil, tips en todas las pantallas y enlaces de invitación (26/10/2026).
  - [ ] Chat del grupo (socket) y notificaciones.
  - Reemplazar los datos de ejemplo (`src/mocks`) pantalla por pantalla.
  - Socket del chat.
  - Consultas periódicas de notificaciones.
