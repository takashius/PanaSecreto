import { Router, Request, Response } from 'express';
import config from '../config/commons';

export const inviteRouter: Router = Router();

/** Mismo formato que genera el backend: PANA-XXXX-XX (se aceptan minúsculas) */
const CODE_RE = /^PANA-[A-Z0-9]{4}-[A-Z0-9]{2}$/;

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

function page(res: Response, status: number, title: string, body: string) {
  res
    .status(status)
    .type('html')
    .set('Cache-Control', 'no-store')
    .send(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
        `<title>${escapeHtml(title)} · EntrePanas</title><meta name="robots" content="noindex"></head>` +
        `<body style="font-family:system-ui,-apple-system,sans-serif;background:#F8F7F2;color:#0B2D5B;margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;text-align:center">` +
        `<main style="max-width:380px;width:100%;background:#fff;border-radius:24px;padding:28px 22px;box-shadow:0 8px 24px rgba(11,45,91,.08)">${body}</main></body></html>`
    );
}

/**
 * Enlace de invitación que se comparte por WhatsApp, etc.: <API_PUBLIC_URL>/join/PANA-XXXX-XX
 * Muestra el código y un botón que abre la app directo en "Unirse" con el código escrito.
 * No revela datos del grupo (eso lo muestra la app después de iniciar sesión).
 */
inviteRouter.get('/join/:code', (req: Request, res: Response) => {
  const code = String(req.params.code ?? '').trim().toUpperCase();
  if (!CODE_RE.test(code)) {
    page(
      res,
      404,
      'Enlace no válido',
      `<p style="font-size:44px;margin:0">🦜</p><h1 style="font-size:20px">Este enlace no es válido</h1>` +
        `<p style="color:#5B6B80">Pídele a quien organiza el grupo que te comparta el código de nuevo.</p>`
    );
    return;
  }
  const appUrl = `${config.appLinkBase}join/${encodeURIComponent(code)}`;
  page(
    res,
    200,
    'Te invitaron a un grupo',
    `<p style="font-size:44px;margin:0">🎁</p>` +
      `<h1 style="font-size:22px;margin:8px 0">¡Te invitaron al amigo secreto!</h1>` +
      `<p style="color:#5B6B80;margin:0 0 18px">Abre EntrePanas para ver el grupo y unirte.</p>` +
      `<div style="font-size:24px;font-weight:800;letter-spacing:2px;background:#E0F6FB;color:#0090AD;border-radius:16px;padding:14px;user-select:all">${escapeHtml(code)}</div>` +
      `<a href="${escapeHtml(appUrl)}" style="display:block;margin-top:18px;background:#FFC107;color:#0B2D5B;font-weight:800;text-decoration:none;border-radius:18px;padding:16px">Abrir en la app</a>` +
      `<p style="color:#5B6B80;font-size:14px;margin:16px 0 0">¿No se abre? Entra a EntrePanas, toca <b>¿Te llegó un código? → Ingresar</b> y escribe el código de arriba.</p>`
  );
});
