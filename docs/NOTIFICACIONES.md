# Notificaciones de EntrePanas

Hay dos canales y siempre salen juntos:

1. **Campana (en la app):** cada aviso se guarda en `Notification` y se ve en la pantalla Notificaciones. Funciona en todos lados, también en Expo Go.
2. **Push (en el teléfono):** cada aviso nuevo de la campana también sale como push por el servicio de Expo. **Solo llega en la app instalada desde un build** (EAS). Expo Go en Android ya no recibe push remotas desde SDK 53.

## Qué genera avisos

| Aviso | Para quién | Destino al tocarlo |
|---|---|---|
| Comentario en un deseo (`comment`) | Dueño del deseo | Su deseo |
| Respuesta (`reply`) | Quien regala | El deseo de su pana |
| Pista en el chat (`chat`, máx. 1 por hora y grupo) | Los demás miembros | Pestaña Chat del grupo |
| Sorteo hecho / reiniciado (`draw`) | Miembros | Mi sobre / grupo |
| Alguien se unió (`join`) | Organizador | Grupo |
| Recordatorios (`reminder`) | Según el caso | Grupo |
| Revelación (`reveal`) | Miembros | El Gran Día |

## Preferencias del usuario (Perfil → Notificaciones)

- `notifyEmail`: correos de grupo.
- `notifyComments`: correos **y push** de comentarios, respuestas y pistas del chat.
- `notifyPush`: todas las push del teléfono. La campana siempre se llena.
- Los recordatorios no se envían como push entre las 9 p. m. y las 8 a. m. (`PUSH_TIMEZONE`, por defecto `America/Caracas`); se quedan en la campana.

## Backend

- `POST /api/push/token` `{ token, platform?, deviceName? }`: registra el teléfono (un token pertenece al último usuario que entró en ese teléfono).
- `DELETE /api/push/token` `{ token }`: lo quita (la app lo llama al cerrar sesión). «Cerrar todas las sesiones» borra todos los teléfonos de la cuenta.
- `services/push.ts`: arma los mensajes (título, texto, `data` con `notificationId`, `kind`, `target`, `groupId`, `wishId`; `badge` = no leídas; canal Android `default`), los envía en bloques de 100 y borra los tokens que Expo marca como `DeviceNotRegistered`. Los teléfonos que no abren la app en 120 días se olvidan solos.
- Variables (opcionales): `PUSH_TRANSPORT` (`expo` o `log`), `EXPO_ACCESS_TOKEN` (solo si activas «Enhanced push security» en expo.dev), `PUSH_TIMEZONE`.

## Avisos desde el panel web (Notificaciones push)

Menú **Notificaciones push** (solo administradores):

- **Destinatarios:** todos, los miembros de un grupo o usuarios elegidos (buscador por nombre o correo, hasta 500). También se llega con los destinatarios ya puestos desde el detalle de un usuario («Enviar push») o de un grupo («Enviar push al grupo»).
- **Alcance antes de enviar:** elegidos, sin la app instalada, con las push apagadas y cuántos lo recibirán (personas y teléfonos).
- **Título** (80) y **mensaje** (240) con vista previa en un teléfono.
- **«Guardar también en la campana de la app»:** queda en Notificaciones de todos los elegidos, aunque no tengan push.
- Al tocar la push: si fue para un grupo abre el grupo; si no, abre Notificaciones.
- **Historial** con fecha, destinatarios, entregadas y quién lo envió.

Solo llega a cuentas activas con las push encendidas y al menos un teléfono registrado; no se aplican las horas de descanso.

API (rol ADMIN o SUPER_ADMIN): `GET /api/push/admin/stats`, `GET /api/push/admin/audience?audience=all|group|users&groupId=&userIds=`, `POST /api/push/admin/send { audience, groupId?, userIds?, title, body, inApp? }`, `GET /api/push/admin/campaigns`.

## App

- `hooks/useNotificationSync.ts`: con sesión, consulta la campana cada minuto con la app abierta y al volver a ella; registra el teléfono para push; al llegar una push recarga; al tocarla la marca leída y abre su destino (también si la app estaba cerrada).
- `notifications/push.ts`: permisos, canal de Android «Avisos de EntrePanas», token de Expo (con el `projectId` de `app.json`) y número del ícono. En Expo Go Android no se carga `expo-notifications` (lanzaría un error) y todo sigue por consulta periódica.
- Pantalla Notificaciones: filtros, agrupadas por día, marcar todo leído, tocar = leída + destino, mantener presionada = borrar, deslizar para recargar.

## Activar las push en Android (una sola vez)

Expo envía a Android a través de Firebase Cloud Messaging (FCM), así que el build necesita credenciales de FCM:

1. **Firebase:** en <https://console.firebase.google.com> crea un proyecto (puedes elegir el mismo proyecto de Google Cloud del inicio de sesión con Google) y agrega una app **Android** con el paquete `com.erdesarrollo.entrepanas`.
2. `google-services.json` está en `apps/mobile/assets/` y `app.json` ya lo usa (`"android.googleServicesFile": "./assets/google-services.json"`). Se puede subir al repositorio: solo trae identificadores públicos.
3. **Clave de servidor (FCM V1):** Firebase → Configuración del proyecto → Cuentas de servicio → «Generar nueva clave privada». Súbela a Expo: en <https://expo.dev> → proyecto `panasecreto` → Credentials → Android → `com.erdesarrollo.entrepanas` → «FCM V1 service account key» (o con `eas credentials`). **No la subas al repositorio.**
4. **Build:** `eas build -p android --profile preview` genera un APK instalable (perfil en `apps/mobile/eas.json`, apunta a la API de producción). Instálalo, inicia sesión y acepta el permiso de notificaciones.

En iOS, EAS configura las credenciales de APNs durante `eas build -p ios` (requiere cuenta de Apple Developer).

## Probar una push a mano

Con el token del teléfono (colección `pushtokens`), en <https://expo.dev/notifications> pega el token, escribe un título y envía. Si llega, el backend también podrá enviarlas.
