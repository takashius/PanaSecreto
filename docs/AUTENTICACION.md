# Autenticación de EntrePanas

La app móvil y el panel usan la misma sesión: un JWT de 7 días que el backend guarda en `user.tokens` (se puede revocar al cerrar sesión, al cambiar la contraseña o desde el panel). La app lo guarda cifrado en el teléfono con `expo-secure-store`.

## Flujos de la app

| Flujo | Pantalla | Endpoint |
|---|---|---|
| Iniciar sesión | `LoginScreen` | `POST /api/user/login` `{ email, password, client: 'mobile' }` |
| Registrarse | `RegisterScreen` | `POST /api/user/register` `{ name, lastName, nickname, email, phone, password }` |
| Restaurar la sesión al abrir | `AuthContext` | `GET /api/user/me` (401 → vuelve al login con aviso) |
| Cerrar sesión | Perfil / Grupos | `POST /api/user/logout` (invalida el token en el servidor) |
| Recuperar contraseña (paso 1) | `RecoverPasswordScreen` | `POST /api/user/recovery/request` `{ email }` |
| Recuperar contraseña (paso 2) | `RecoverPasswordScreen` | `POST /api/user/recovery` `{ email, code, newPass }` y luego entra solo con la nueva clave |
| Continuar con Google | Login y Registro | ver abajo |

Todas las respuestas de sesión traen el mismo usuario: `_id, name, lastName, email, phone, photo, nickname, gender, notifyEmail, notifyComments, role, hasPassword, googleLinked, token` (Google agrega `isNew`).

Reglas de la app para contraseñas nuevas: mínimo 8 caracteres y un número (el backend acepta desde 6, para no romper cuentas viejas). En desarrollo, la recuperación muestra el código de prueba (`devCode`) y lo rellena solo; en producción solo llega por correo.

La URL de la API se toma de `EXPO_PUBLIC_API_URL` (archivo `apps/mobile/.env`). Si no se define, en Expo Go se usa la IP de la computadora que corre Metro con el puerto 4000.

## Continuar con Google

Funciona en **Expo Go** y en la app instalada, sin módulos nativos, y termina en la misma sesión que el login con correo:

```
App ──(1) navegador──▶ API /api/user/google/start?redirect=exp://…/--/auth/google
API ──(2) 302────────▶ Google (cliente "Aplicación web", state firmado + nonce)
Google ─(3) 302──────▶ API /api/user/google/callback?code=…&state=…
API: canjea el código, verifica el ID token (firma, emisor, audiencia, nonce),
     busca la cuenta por googleId → por correo verificado (la vincula) → o la crea
API ──(4) 302────────▶ exp://…/--/auth/google?ticket=… (ticket de un solo uso, 5 min)
App ──(5)────────────▶ POST /api/user/google/exchange { ticket } → { …usuario, token }
```

- El JWT nunca viaja en la URL; el ticket se guarda como hash y se borra al canjearlo.
- Solo se vuelve a esquemas permitidos (`GOOGLE_APP_REDIRECT_SCHEMES`: `entrepanas`, `exp`, `exps`).
- Las cuentas creadas con Google quedan con `hasPassword: false`: pueden crear su contraseña con «¿Olvidaste tu contraseña?» o desde Cambiar contraseña (sin pedir la actual).
- Si ya existía una cuenta con ese correo, se vincula y sigue entrando también con su contraseña.
- `POST /api/user/google { idToken }` acepta un ID token directo (para un futuro inicio nativo o el panel web con Google Identity Services).
- `GET /api/user/google/config` → `{ enabled }`.

### Configuración (una sola vez)

1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Pantalla de consentimiento de OAuth**: tipo externo, nombre «EntrePanas», correo de soporte, logo, dominios y los alcances `openid`, `email`, `profile`. Mientras esté en modo prueba, agrega los correos que van a probar.
2. **Credenciales → Crear ID de cliente de OAuth → Aplicación web**.
   - URI de redirección autorizado: `https://<tu-api>/api/user/google/callback`.
3. En el `.env` del backend:
   ```
   API_PUBLIC_URL=https://<tu-api>
   GOOGLE_WEB_CLIENT_ID=…apps.googleusercontent.com
   GOOGLE_WEB_CLIENT_SECRET=…
   ```
4. Reinicia el backend. `GET /api/user/google/config` debe responder `{ "enabled": true }`.

### Probar en el teléfono durante el desarrollo

Google no acepta IP locales (`http://192.168.x.x`) como redirección; solo `localhost` o `https`. Opciones:

- **Túnel** (recomendado): `cloudflared tunnel --url http://localhost:4000` (o ngrok). Pon la URL `https://…` que te da en `API_PUBLIC_URL` y como URI autorizado en Google. La app puede seguir hablando con la API por la IP local: el túnel solo lo usa Google para volver.
- **Backend desplegado** (Coolify) con su dominio `https`.

Si Google no está configurado, el botón responde «El inicio de sesión con Google aún no está configurado en el servidor».
