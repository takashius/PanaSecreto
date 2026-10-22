# API de Grupos — EntrePanas

Base: `/api/group` (también disponible como `/group`). Todas las rutas requieren `Authorization: Bearer <token>`.

Los errores tienen la forma `{ "code": "CODIGO", "message": "Texto para el usuario" }`. Los de validación incluyen además `errors` por campo.

## Ciclo de vida

```
WAITING ──draw──▶ LOCKED ──reveal──▶ REVEALED ──complete──▶ COMPLETED
   ▲                │                                  ▲
   └──draw (DELETE)─┘                                  │
                    └────────────complete──────────────┘
```

- **WAITING**: se puede unir gente, editar el presupuesto y el cupo, expulsar miembros y definir exclusiones.
- **LOCKED**: sorteo hecho. Cada quien ve solo su "sobre". El organizador puede deshacerlo.
- **REVEALED**: todos los miembros pueden ver la lista completa de quién le regaló a quién.
- **COMPLETED**: histórico, solo lectura.

## Endpoints

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| `POST` | `/` | cualquier usuario | Crear grupo (queda como organizador, `CREATOR`) |
| `GET` | `/?scope=all\|created\|joined` | usuario | Mis grupos (resumen para el inicio) |
| `GET` | `/code/:code` | usuario | Vista previa de un grupo por código antes de unirse |
| `POST` | `/join` | usuario | Unirse con `{ inviteCode }` (idempotente) |
| `GET` | `/:id` | miembro / admin | Detalle del grupo |
| `PATCH` | `/:id` | organizador | Editar datos (no el estado) |
| `DELETE` | `/:id` | organizador / admin | Eliminar grupo y sus asignaciones |
| `POST` | `/:id/invite-code` | organizador | Regenerar código (solo WAITING) |
| `POST` | `/:id/invitations` | organizador | Invitar por correo `{ emails: [..20], message? }` (solo WAITING y con cupo; omite a los que ya son miembros; 10 envíos/hora) |
| `DELETE` | `/:id/members/me` | participante | Salir del grupo (solo WAITING) |
| `DELETE` | `/:id/members/:userId` | organizador | Expulsar miembro (solo WAITING) |
| `PUT` | `/:id/members/:userId/exclusions` | organizador | `{ exclusions: [userId], mutual?: true }` |
| `POST` | `/:id/draw` | organizador | Realizar el sorteo → LOCKED |
| `DELETE` | `/:id/draw` | organizador | Deshacer el sorteo → WAITING (solo LOCKED) |
| `POST` | `/:id/reveal` | organizador | Revelar → REVEALED |
| `POST` | `/:id/complete` | organizador | Finalizar → COMPLETED |
| `GET` | `/:id/alias/suggestions?gender=&exclude=` | miembro | 5 alias sugeridos al azar (género de la persona + neutros) |
| `PUT` | `/:id/members/me/alias` | miembro | Elegir o escribir mi alias `{ alias, emoji? }` (solo WAITING) |
| `GET` | `/:id/assignment` | miembro | **Mi sobre**: alias de mi pana (identidad solo tras revelar) |
| `POST` | `/:id/envelope/open` | miembro | Registrar que abrí el sobre (idempotente) |
| `GET` | `/:id/reveal` | miembro | El Gran Día: `giftedTo` y `giftedBy` (solo REVEALED/COMPLETED) |
| `GET` | `/:id/assignments` | miembro | Lista completa (solo REVEALED/COMPLETED) |
| `GET` | `/admin?q=&status=&page=&limit=` | ADMIN / SUPER_ADMIN | Listado global para el panel |

## Crear grupo — cuerpo

```json
{
  "name": "Hallacas con los Primos",
  "emoji": "🫔",
  "description": "Opcional, máx. 500",
  "exchangeDate": "2026-12-24T20:00:00.000Z",
  "currency": "USD",          // USD | VES (por defecto USD)
  "budgetMin": 10,            // null = sin mínimo
  "budgetMax": 35,            // null = sin límite
  "maxParticipants": 12,      // 3–50 (por defecto 50)
  "anonymousClues": true,
  "location": { "name": "Casa de la abuela", "address": "Mérida" },  // opcional, null lo quita
  "note": "Traigan hallacas"                                       // opcional, máx. 300
}
```

El detalle (`GET /:id`) incluye `location`, `note`, `myAlias`, `myAliasEmoji`, `envelopeOpened` y, por miembro, `hasAlias` (sin decir cuál: el alias nunca se asocia a una persona). La vista previa por código agrega descripción, lugar, nota e iniciales/foto de hasta 12 miembros.

Reglas: la fecha debe ser futura y `budgetMin ≤ budgetMax`. El código de invitación se genera con el formato `PANA-XXXX-XX`; al buscarlo no importan mayúsculas ni minúsculas.

## Privacidad

- Las asignaciones viven en una colección aparte (`Assignment`) y **nunca** viajan con el grupo.
- Ni el organizador ve quién le regala a quién antes de revelar.
- Los emails y las exclusiones de los miembros solo los ven el organizador y los administradores.
- Un no-miembro recibe `404` (no se revela que el grupo existe).
- **Alias:** antes de revelar, el sobre y la lista de tu pana solo traen su alias (`receiver.alias`, `receiver.aliasEmoji`) y los deseos no traen `userId`. Al revelar se agregan `userId`, `name`, `lastName` y `photo`.

## Alias

- Uno por persona y grupo; se usa en el sobre, el chat y los comentarios.
- 3 a 30 caracteres, único dentro del grupo (sin importar mayúsculas), con filtro de groserías para los alias propios. Errores: `ALIAS_NOT_ALLOWED`, `ALIAS_TAKEN`, `ALIAS_LOCKED`.
- Quien no elija recibe uno del catálogo al hacer el sorteo (según su género y sin repetir).
- Catálogo inicial de 300 alias (100 M / 100 F / 100 N) en `components/alias/seed.ts`.

## Algoritmo de sorteo

`apps/backend/src/components/group/draw.ts`:
1. Muestreo por rechazo de permutaciones aleatorias con `crypto.randomInt`. Es uniforme entre las asignaciones válidas.
2. Si hay muchas exclusiones, pasa a un emparejamiento bipartito (algoritmo de Kuhn) con órdenes aleatorios. Es polinomial y detecta cuándo el sorteo es imposible.
3. Si es imposible, responde `422 NO_VALID_ASSIGNMENT` con `blockedMembers`. Al guardar exclusiones, la respuesta incluye `drawPossible` para avisar antes de sortear.

El sorteo solo se confirma si nadie cambió los miembros mientras se calculaba (control con `membersVersion`).

## Códigos de error frecuentes

`GROUP_NOT_FOUND` · `ALIAS_TAKEN` · `ALIAS_LOCKED` · `ALIAS_NOT_ALLOWED` · `NOT_GROUP_CREATOR` · `GROUP_NOT_WAITING` · `GROUP_FULL` · `INVALID_INVITE_CODE` · `ALREADY_DRAWN` · `NOT_DRAWN_YET` · `NOT_ENOUGH_PARTICIPANTS` · `NO_VALID_ASSIGNMENT` · `NOT_REVEALED` · `MAX_BELOW_MEMBERS` · `CREATOR_CANNOT_LEAVE` · `INVALID_EXCLUSIONS` · `CONCURRENT_CHANGE` · `VALIDATION_ERROR`

## Lista de deseos

Base: `/api/group/:id/wishlist`. Requiere ser miembro del grupo.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/me` | Mi lista en este grupo (favoritos primero) |
| `POST` | `/` | Agregar deseo (máx. 20 por persona y grupo). JSON o `multipart/form-data` con campo `image` |
| `PATCH` | `/:wishId` | Editar un deseo propio (`productUrl: null` lo borra; `image` la reemplaza; `removeImage: true` la quita) |
| `DELETE` | `/:wishId` | Eliminar un deseo propio |
| `GET` | `/assigned` | Lista de mi amigo secreto (solo tras el sorteo) |

Cuerpo de creación:

```json
{
  "title": "Cien años de soledad",
  "description": "Edición tapa dura",
  "estimatedPrice": 25,
  "currency": "USD",          // por defecto la moneda del grupo
  "productUrl": "https://…",   // solo http/https
  "isFavorite": true,
  "category": "libros",       // ropa | tecnologia | hogar | dulces | libros | otro (por defecto otro)
  "storeName": "Tecni-Ciencia" // opcional, máx. 80; null lo borra
}
```

Las listas (`/me` y `/assigned`) incluyen `commentsCount` y `unansweredCount` por deseo. `/assigned` trae `revealed` y `receiver` (alias, y la identidad solo tras revelar).

### Comentarios anónimos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/:wishId/comments` | Hilo del deseo: `{ results, myRole, canComment }` |
| `POST` | `/:wishId/comments` | `{ text }` (máx. 500) |

- Solo el dueño del deseo y quien le regala; para cualquier otro, `404`. Se abren tras el sorteo (`409 NOT_DRAWN_YET`) y se cierran al finalizar (`409 GROUP_COMPLETED`).
- Cada comentario: `{ id, author: "me"|"other", authorRole: "owner"|"giver", text, createdAt }`. Nunca viaja el usuario.
- Aviso en la app al otro lado y correo si tiene `notifyEmail` y `notifyComments`.

- **Imagen:** JPG, PNG, WEBP, GIF o ICO de hasta 8 MB (sin SVG). Se guarda en Cloudinary (`<FOLDER_NAME>/wishlist`) limitada a 1600 px, y la respuesta incluye `imageUrl`. La membresía se valida **antes** de aceptar el archivo. Si la operación falla, la imagen recién subida se borra, y al reemplazar, quitar o eliminar un deseo se borra la anterior. Errores: `INVALID_FILE_TYPE` (400), `FILE_TOO_LARGE` (413), `UPLOAD_FAILED` (502).
- En multipart los campos llegan como texto; el backend convierte `estimatedPrice`, `isFavorite` y `null`.
- Un deseo ajeno responde `404`.
- Con el grupo `COMPLETED`, la lista queda en solo lectura (`409 GROUP_COMPLETED`).
- Al salir o ser expulsado de un grupo se borran los deseos de esa persona (y sus imágenes). Al eliminar el grupo se borran todos.
- Errores: `WISH_NOT_FOUND`, `WISHLIST_FULL`, `NOT_DRAWN_YET`, `ASSIGNMENT_NOT_FOUND`.

## Chat del grupo

REST (requiere ser miembro):

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/group/:id/chat?before=&limit=` | Historial (50 por defecto, máx. 100), del más viejo al más nuevo. Incluye `hasMore`, `readOnly`, `myAlias` y `cluesEnabled` |
| `POST` | `/api/group/:id/chat` | `{ text, kind: "mensaje"|"pista" }` |
| `POST` | `/api/group/:id/chat/read` | Marca el chat como leído |
| `GET` | `/api/chat` | Mis chats: último mensaje, no leídos, alias y `readOnly`; `totalUnread` |

Socket.io (mismo servidor; `auth: { token }`):

| Evento | Dirección | Datos |
|---|---|---|
| `chat:join` | cliente → servidor | `{ groupId }` → ack `{ ok, readOnly, myAlias, myAliasEmoji }` |
| `chat:leave` | cliente → servidor | `{ groupId }` |
| `chat:send` | cliente → servidor | `{ groupId, text, kind }` → ack `{ ok, message }` o `{ ok: false, code, message }` |
| `chat:read` | cliente → servidor | `{ groupId }` → ack `{ ok }` |
| `chat:message` | servidor → sala | `{ id, groupId, alias, aliasEmoji, text, kind, createdAt }` |

- Los mensajes nunca traen el usuario; `mine` solo aparece en el historial propio y en el ack.
- Hace falta tener alias (`409 ALIAS_REQUIRED`). Las pistas solo van tras el sorteo y si el grupo las permite (`CLUES_DISABLED`). Máximo 20 mensajes por minuto (`429 CHAT_RATE_LIMITED`). Tras revelar, solo lectura (`409 CHAT_READ_ONLY`).
- Una pista avisa en la app a los demás (máx. una vez por hora y grupo).

## Notificaciones en la app

Base `/api/notifications`:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/?unread=true&groupId=&page=&limit=` | `{ results, total, unread }` |
| `GET` | `/unread-count` | `{ unread }` para la campana |
| `POST` | `/:id/read` | Marcar una como leída |
| `POST` | `/read-all` | Marcar todas (opcional `groupId`) |
| `DELETE` | `/:id` | Eliminar una |

Cada notificación: `{ id, kind, target, title, body, groupId, wishId, read, createdAt }`.
- `kind`: `comment`, `reply`, `chat`, `draw`, `join`, `reminder`, `reveal`.
- `target` (pantalla a abrir): `myWish`, `wish`, `envelope`, `group`, `chat`, `reveal`.
- Recordatorios cada hora (`services/reminders.ts`), sin duplicados: faltan 3 días / mañana, sobre sin abrir, lista vacía y alias sin elegir.
- Se borran solas a los 90 días.

## Tips rotativos

- `GET /api/tips?screen=sobre.lista&general=true&limit=20` (público): tips activos de la pantalla más los generales, en orden aleatorio ponderado por `weight`.
- Pantallas: `general`, `grupos`, `grupo.resumen`, `sobre.sellado`, `sobre.lista`, `deseo.detalle`, `deseo.formulario`, `deseos`, `chat.lista`, `chat.sala`, `notificaciones`, `unirse`, `exclusiones`, `revelacion`.

## Administración de catálogos (ADMIN / SUPER_ADMIN)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/alias/admin?q=&gender=&active=&page=&limit=` | Catálogo de alias + `byGender` |
| `POST` | `/api/alias/admin` | `{ text, gender, emoji?, active? }` |
| `PATCH` / `DELETE` | `/api/alias/admin/:id` | Editar / eliminar |
| `GET` | `/api/alias/admin/custom` | Alias propios escritos por usuarios (con `flagged`) |
| `DELETE` | `/api/alias/admin/custom/:groupId/:userId` | Quitar un alias propio (antes del sorteo vuelve a elegir; después se reemplaza por uno neutro) |
| `GET` | `/api/tips/admin?q=&screen=&active=` | Tips + `activePerScreen` |
| `POST` | `/api/tips/admin` | `{ text, screens[], active?, weight? }` |
| `PATCH` / `DELETE` | `/api/tips/admin/:id` | Editar / eliminar |

## Estadísticas (panel)

`GET /api/stats` (ADMIN / SUPER_ADMIN) devuelve:
- Usuarios: total, activos, por rol y nuevos en 30 días.
- Grupos: por estado, participaciones y promedio por grupo.
- Total de deseos.
- Registros por día de los últimos 30 días (zona `REPORT_TIMEZONE`).
- Próximos intercambios.
