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
| `GET` | `/:id/assignment` | miembro | **Abrir mi sobre**: a quién le regalo |
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
  "anonymousClues": true
}
```

Reglas: la fecha debe ser futura y `budgetMin ≤ budgetMax`. El código de invitación se genera con el formato `PANA-XXXX-XX`; al buscarlo no importan mayúsculas ni minúsculas.

## Privacidad

- Las asignaciones viven en una colección aparte (`Assignment`) y **nunca** viajan con el grupo.
- Ni el organizador ve quién le regala a quién antes de revelar.
- Los emails y las exclusiones de los miembros solo los ven el organizador y los administradores.
- Un no-miembro recibe `404` (no se revela que el grupo existe).

## Algoritmo de sorteo

`apps/backend/src/components/group/draw.ts`:
1. Muestreo por rechazo de permutaciones aleatorias con `crypto.randomInt`. Es uniforme entre las asignaciones válidas.
2. Si hay muchas exclusiones, pasa a un emparejamiento bipartito (algoritmo de Kuhn) con órdenes aleatorios. Es polinomial y detecta cuándo el sorteo es imposible.
3. Si es imposible, responde `422 NO_VALID_ASSIGNMENT` con `blockedMembers`. Al guardar exclusiones, la respuesta incluye `drawPossible` para avisar antes de sortear.

El sorteo solo se confirma si nadie cambió los miembros mientras se calculaba (control con `membersVersion`).

## Códigos de error frecuentes

`GROUP_NOT_FOUND` · `NOT_GROUP_CREATOR` · `GROUP_NOT_WAITING` · `GROUP_FULL` · `INVALID_INVITE_CODE` · `ALREADY_DRAWN` · `NOT_DRAWN_YET` · `NOT_ENOUGH_PARTICIPANTS` · `NO_VALID_ASSIGNMENT` · `NOT_REVEALED` · `MAX_BELOW_MEMBERS` · `CREATOR_CANNOT_LEAVE` · `INVALID_EXCLUSIONS` · `CONCURRENT_CHANGE` · `VALIDATION_ERROR`

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
  "isFavorite": true
}
```

- **Imagen:** JPG, PNG, WEBP, GIF o ICO de hasta 8 MB (sin SVG). Se guarda en Cloudinary (`<FOLDER_NAME>/wishlist`) limitada a 1600 px, y la respuesta incluye `imageUrl`. La membresía se valida **antes** de aceptar el archivo. Si la operación falla, la imagen recién subida se borra, y al reemplazar, quitar o eliminar un deseo se borra la anterior. Errores: `INVALID_FILE_TYPE` (400), `FILE_TOO_LARGE` (413), `UPLOAD_FAILED` (502).
- En multipart los campos llegan como texto; el backend convierte `estimatedPrice`, `isFavorite` y `null`.
- Un deseo ajeno responde `404`.
- Con el grupo `COMPLETED`, la lista queda en solo lectura (`409 GROUP_COMPLETED`).
- Al salir o ser expulsado de un grupo se borran los deseos de esa persona (y sus imágenes). Al eliminar el grupo se borran todos.
- Errores: `WISH_NOT_FOUND`, `WISHLIST_FULL`, `NOT_DRAWN_YET`, `ASSIGNMENT_NOT_FOUND`.

## Estadísticas (panel)

`GET /api/stats` (ADMIN / SUPER_ADMIN) devuelve:
- Usuarios: total, activos, por rol y nuevos en 30 días.
- Grupos: por estado, participaciones y promedio por grupo.
- Total de deseos.
- Registros por día de los últimos 30 días (zona `REPORT_TIMEZONE`).
- Próximos intercambios.
