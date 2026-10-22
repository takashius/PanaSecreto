/**
 * Plantillas de correo de EntrePanas (HTML compatible con clientes de correo + texto plano).
 * Colores de marca: Azul Marino #0B2D5B, Amarillo Pana #FFC107, Crema #F8F7F2. Tipografía: Fredoka (titulares) y Nunito (texto), con respaldo Arial.
 *
 * Encabezado: logo horizontal (assets/logos/logo-horizontal-transparente.png) servido desde Cloudinary.
 *
 * Por privacidad, ningún correo revela a quién le regala cada persona: eso solo se ve en la app.
 */
import config from '../config/commons';

export interface MailContent {
  subject: string;
  html: string;
  text: string;
}

const REPORT_TZ = process.env.REPORT_TIMEZONE || 'America/Caracas';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function formatExchangeDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: REPORT_TZ,
  }).format(new Date(date));
}

export function formatBudget(min: number | null | undefined, max: number | null | undefined, currency: string): string {
  const fmt = (n: number) => `${currency === 'VES' ? 'Bs.' : '$'} ${new Intl.NumberFormat('es-VE').format(n)}`;
  if (min == null && max == null) return 'Sin límite';
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (max != null) return `Hasta ${fmt(max)}`;
  return `Desde ${fmt(min as number)}`;
}

interface LayoutOptions {
  title: string;
  greeting: string;
  paragraphs: string[]; // HTML ya escapado/seguro
  details?: Array<[string, string]>; // [etiqueta, valor] (texto plano, se escapa)
  cta?: { label: string; url: string };
  highlight?: string; // HTML seguro en un recuadro destacado
  footerNote?: string;
}

/** public_id fijo del logo horizontal en Cloudinary (lo sube `pnpm mail:logo`) */
export const MAIL_LOGO_PUBLIC_ID = 'EntrePanas/branding/email-logo-horizontal';

/** URL del logo de los correos: MAIL_LOGO_URL, o la imagen fija en Cloudinary, o el sitio público */
export function mailLogoUrl(): string {
  if (config.mail.logoUrl) return config.mail.logoUrl;
  if (config.cloudinary.CLOUD_NAME) {
    return `https://res.cloudinary.com/${config.cloudinary.CLOUD_NAME}/image/upload/${MAIL_LOGO_PUBLIC_ID}.png`;
  }
  return `${config.appUrl}/logo-horizontal.png`;
}

function layout(o: LayoutOptions): string {
  const details = o.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#F8F7F2;border-radius:12px;">
        ${o.details
          .map(
            ([k, v]) =>
              `<tr><td style="padding:10px 16px;font-size:13px;color:#5B6B80;width:42%;">${escapeHtml(k)}</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#13213A;">${escapeHtml(v)}</td></tr>`
          )
          .join('')}
      </table>`
    : '';
  const cta = o.cta
    ? `<div style="text-align:center;margin:8px 0 20px 0;">
        <a href="${escapeHtml(o.cta.url)}" style="display:inline-block;background:#FFC107;color:#0B2D5B;font-weight:800;font-size:15px;text-decoration:none;padding:14px 28px;border-radius:12px;">${escapeHtml(o.cta.label)}</a>
      </div>`
    : '';
  const highlight = o.highlight
    ? `<div style="text-align:center;margin:0 0 20px 0;">${o.highlight}</div>`
    : '';
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(o.title)}</title><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@400;600;800&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#F8F7F2;font-family:Nunito,Arial,Helvetica,sans-serif;color:#13213A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#FFFFFF;padding:24px 24px 18px 24px;text-align:center;border-bottom:4px solid #FFC107;">
          <img src="${escapeHtml(mailLogoUrl())}" width="240" alt="EntrePanas · Conecta, comparte, disfruta" style="display:inline-block;width:240px;max-width:80%;height:auto;border:0;outline:none;text-decoration:none;font-family:Fredoka,'Trebuchet MS',Arial,sans-serif;font-size:26px;font-weight:700;color:#0B2D5B;">
        </td></tr>
        <tr><td style="padding:28px 28px 8px 28px;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 12px 0;">${o.greeting}</p>
          ${o.paragraphs.map((p) => `<p style="margin:0 0 16px 0;">${p}</p>`).join('')}
          ${highlight}
          ${details}
          ${cta}
        </td></tr>
        <tr><td style="padding:8px 28px 28px 28px;font-size:12px;color:#5B6B80;line-height:1.5;">
          ${o.footerNote ?? 'Recibes este correo porque tienes una cuenta en EntrePanas.'}
        </td></tr>
      </table>
      <p style="font-size:11px;color:#8A94A6;margin-top:16px;">© ${new Date().getFullYear()} EntrePanas · Amigo Secreto entre panas</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function plain(greeting: string, lines: Array<string | undefined>): string {
  return [greeting, '', ...lines.filter((l): l is string => l !== undefined)].join('\n');
}

const firstName = (name?: string) => (name || 'Pana').trim().split(/\s+/)[0];
const e = escapeHtml;

/* ------------------------------------------------------------------ Cuenta */

export function recoveryCodeEmail(params: { name: string; code: number | string; minutes: number }): MailContent {
  const name = firstName(params.name);
  const code = String(params.code);
  const subject = `Tu código de recuperación: ${code}`;
  const html = layout({
    title: subject,
    greeting: `¡Epa, ${e(name)}!`,
    paragraphs: ['Recibimos una solicitud para restablecer tu contraseña. Usa este código:'],
    highlight: `<span style="display:inline-block;font-size:32px;letter-spacing:8px;font-weight:800;color:#0B2D5B;background:#FFF6D6;border:2px dashed #FFC107;border-radius:12px;padding:14px 22px;">${e(code)}</span>
      <p style="margin:16px 0 0 0;font-size:14px;">Vence en <strong>${params.minutes} minutos</strong> y solo puede usarse una vez.</p>
      <p style="margin:8px 0 0 0;color:#5B6B80;font-size:13px;">Por seguridad, nunca compartas este código con nadie.</p>`,
    footerNote: 'Si no solicitaste este correo, puedes ignorarlo con tranquilidad. Tu cuenta sigue segura.',
  });
  const text = plain(`¡Epa, ${name}!`, [
    'Recibimos una solicitud para restablecer tu contraseña de EntrePanas.',
    `Tu código de recuperación es: ${code}`,
    '',
    `Vence en ${params.minutes} minutos y solo puede usarse una vez. No lo compartas con nadie.`,
    'Si no solicitaste este cambio, ignora este correo.',
  ]);
  return { subject, html, text };
}

export function welcomeEmail(params: { name: string; appUrl: string }): MailContent {
  const name = firstName(params.name);
  const subject = `¡Bienvenido a EntrePanas, ${name}! 🎁`;
  const html = layout({
    title: subject,
    greeting: `¡Epa, ${e(name)}! Ya eres parte de EntrePanas.`,
    paragraphs: [
      'Organiza tu Amigo Secreto sin papelitos: crea un grupo, invita a tus panas con un código y deja que el sorteo haga su magia.',
      '<strong>¿Te pasaron un código?</strong> Ingrésalo en la app para unirte al grupo. <strong>¿Vas a organizar?</strong> Crea tu grupo, define fecha y presupuesto, y comparte el código por WhatsApp.',
      'No olvides armar tu <strong>lista de deseos</strong> para que tu amigo secreto acierte con el regalo.',
    ],
    cta: { label: 'Abrir EntrePanas', url: params.appUrl },
  });
  const text = plain(`¡Epa, ${name}! Ya eres parte de EntrePanas.`, [
    'Crea un grupo, invita a tus panas con un código y deja que el sorteo haga su magia.',
    '¿Te pasaron un código? Ingrésalo en la app para unirte. ¿Vas a organizar? Crea tu grupo y compártelo.',
    'Arma tu lista de deseos para que tu amigo secreto acierte.',
    '',
    params.appUrl,
  ]);
  return { subject, html, text };
}

export function accountCreatedEmail(params: {
  name: string;
  email: string;
  roleLabel: string;
  loginUrl: string;
  isWebRole: boolean;
}): MailContent {
  const name = firstName(params.name);
  const subject = 'Se creó tu cuenta en EntrePanas';
  const html = layout({
    title: subject,
    greeting: `¡Hola, ${e(name)}!`,
    paragraphs: [
      `Un administrador creó tu cuenta en EntrePanas con el rol <strong>${e(params.roleLabel)}</strong>.`,
      'La contraseña temporal te la entregará el administrador. En tu primer inicio de sesión el sistema te pedirá cambiarla. Si no la tienes, usa <strong>«¿Olvidaste tu contraseña?»</strong> para crear una nueva.',
    ],
    details: [
      ['Correo de acceso', params.email],
      ['Rol', params.roleLabel],
    ],
    cta: { label: params.isWebRole ? 'Ir al panel' : 'Abrir EntrePanas', url: params.loginUrl },
    footerNote: 'Si no esperabas este correo, comunícate con el administrador de EntrePanas.',
  });
  const text = plain(`¡Hola, ${name}!`, [
    `Un administrador creó tu cuenta en EntrePanas con el rol ${params.roleLabel}.`,
    `Correo de acceso: ${params.email}`,
    'La contraseña temporal te la entregará el administrador; deberás cambiarla en tu primer inicio de sesión.',
    'Si no la tienes, usa "¿Olvidaste tu contraseña?".',
    '',
    params.loginUrl,
  ]);
  return { subject, html, text };
}

export type PasswordChangeReason = 'self' | 'recovery' | 'required' | 'admin';

export function passwordChangedEmail(params: { name: string; reason: PasswordChangeReason; when: Date }): MailContent {
  const name = firstName(params.name);
  const when = new Intl.DateTimeFormat('es-VE', { dateStyle: 'long', timeStyle: 'short', timeZone: REPORT_TZ }).format(params.when);
  const how: Record<PasswordChangeReason, string> = {
    self: 'desde tu perfil',
    recovery: 'con un código de recuperación',
    required: 'al completar el cambio obligatorio',
    admin: 'por un administrador (deberás cambiarla en tu próximo inicio de sesión)',
  };
  const subject = 'Tu contraseña de EntrePanas cambió';
  const html = layout({
    title: subject,
    greeting: `Hola, ${e(name)}:`,
    paragraphs: [
      `La contraseña de tu cuenta se cambió ${e(how[params.reason])} el <strong>${e(when)}</strong>.`,
      params.reason === 'admin' || params.reason === 'recovery'
        ? 'Por seguridad cerramos todas tus sesiones abiertas.'
        : 'Por seguridad cerramos tus otras sesiones abiertas.',
      '<strong>¿No fuiste tú?</strong> Restablece tu contraseña de inmediato con «¿Olvidaste tu contraseña?» y avísanos.',
    ],
    footerNote: 'Este es un aviso de seguridad automático; no es necesario responder.',
  });
  const text = plain(`Hola, ${name}:`, [
    `La contraseña de tu cuenta de EntrePanas se cambió ${how[params.reason]} el ${when}.`,
    '¿No fuiste tú? Restablece tu contraseña de inmediato con "¿Olvidaste tu contraseña?".',
  ]);
  return { subject, html, text };
}

/* ------------------------------------------------------------------ Grupos */

export interface GroupMailInfo {
  name: string;
  emoji?: string;
  exchangeDate: Date | string;
  currency: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  organizerName: string;
}

const groupTitle = (g: GroupMailInfo) => `${g.emoji ? `${g.emoji} ` : ''}${g.name}`;
const groupDetails = (g: GroupMailInfo): Array<[string, string]> => [
  ['Grupo', groupTitle(g)],
  ['Organiza', g.organizerName],
  ['Fecha del intercambio', formatExchangeDate(g.exchangeDate)],
  ['Presupuesto', formatBudget(g.budgetMin, g.budgetMax, g.currency)],
];

export function groupInvitationEmail(params: {
  group: GroupMailInfo;
  inviterName: string;
  inviteCode: string;
  joinUrl: string;
  personalMessage?: string;
}): MailContent {
  const g = params.group;
  const subject = `${params.inviterName} te invitó a su Amigo Secreto «${g.name}» 🎄`;
  const html = layout({
    title: subject,
    greeting: '¡Epa, pana!',
    paragraphs: [
      `<strong>${e(params.inviterName)}</strong> te invitó a participar en el Amigo Secreto <strong>${e(groupTitle(g))}</strong>.`,
      ...(params.personalMessage ? [`<em>«${e(params.personalMessage)}»</em>`] : []),
      'Descarga EntrePanas, crea tu cuenta y únete con este código:',
    ],
    highlight: `<span style="display:inline-block;font-size:24px;letter-spacing:3px;font-weight:800;color:#0B2D5B;background:#FFF6D6;border:2px dashed #FFC107;border-radius:12px;padding:12px 20px;font-family:monospace;">${e(params.inviteCode)}</span>`,
    details: groupDetails(g),
    cta: { label: 'Unirme al grupo', url: params.joinUrl },
    footerNote: `Recibes este correo porque ${e(params.inviterName)} te invitó desde EntrePanas. Si no conoces a esta persona, puedes ignorarlo.`,
  });
  const text = plain('¡Epa, pana!', [
    `${params.inviterName} te invitó a participar en el Amigo Secreto "${groupTitle(g)}".`,
    params.personalMessage ? `"${params.personalMessage}"` : undefined,
    `Código para unirte: ${params.inviteCode}`,
    `Fecha: ${formatExchangeDate(g.exchangeDate)} · Presupuesto: ${formatBudget(g.budgetMin, g.budgetMax, g.currency)}`,
    '',
    params.joinUrl,
  ]);
  return { subject, html, text };
}

export function joinedGroupEmail(params: { name: string; group: GroupMailInfo; groupUrl: string }): MailContent {
  const name = firstName(params.name);
  const g = params.group;
  const subject = `¡Ya estás en «${g.name}»! 🎉`;
  const html = layout({
    title: subject,
    greeting: `¡Bienvenido al grupo, ${e(name)}!`,
    paragraphs: [
      `Te uniste al Amigo Secreto <strong>${e(groupTitle(g))}</strong>. Cuando ${e(g.organizerName)} haga el sorteo te avisaremos para que abras tu sobre.`,
      'Mientras tanto, arma tu <strong>lista de deseos</strong> con ideas, precios e imágenes: así tu amigo secreto acertará.',
    ],
    details: groupDetails(g),
    cta: { label: 'Ver el grupo', url: params.groupUrl },
  });
  const text = plain(`¡Bienvenido al grupo, ${name}!`, [
    `Te uniste al Amigo Secreto "${groupTitle(g)}". Te avisaremos cuando se haga el sorteo.`,
    `Fecha: ${formatExchangeDate(g.exchangeDate)} · Presupuesto: ${formatBudget(g.budgetMin, g.budgetMax, g.currency)}`,
    'Arma tu lista de deseos para que tu amigo secreto acierte.',
    '',
    params.groupUrl,
  ]);
  return { subject, html, text };
}

export function memberJoinedEmail(params: {
  organizerName: string;
  memberName: string;
  groupName: string;
  memberCount: number;
  maxParticipants: number;
  groupUrl: string;
}): MailContent {
  const name = firstName(params.organizerName);
  const subject = `${params.memberName} se unió a «${params.groupName}»`;
  const full = params.memberCount >= params.maxParticipants;
  const html = layout({
    title: subject,
    greeting: `¡Buenas noticias, ${e(name)}!`,
    paragraphs: [
      `<strong>${e(params.memberName)}</strong> se unió a tu grupo <strong>${e(params.groupName)}</strong>.`,
      full
        ? '🎯 <strong>El grupo está completo.</strong> Ya puedes revisar las exclusiones y hacer el sorteo.'
        : 'Cuando estén todos, revisa las exclusiones y haz el sorteo desde la app.',
    ],
    details: [['Participantes', `${params.memberCount} de ${params.maxParticipants}`]],
    cta: { label: 'Gestionar el grupo', url: params.groupUrl },
  });
  const text = plain(`¡Buenas noticias, ${name}!`, [
    `${params.memberName} se unió a tu grupo "${params.groupName}" (${params.memberCount} de ${params.maxParticipants}).`,
    full ? 'El grupo está completo: ya puedes hacer el sorteo.' : undefined,
    '',
    params.groupUrl,
  ]);
  return { subject, html, text };
}

export function drawCompletedEmail(params: { name: string; group: GroupMailInfo; groupUrl: string }): MailContent {
  const name = firstName(params.name);
  const g = params.group;
  const subject = `🎁 ¡Ya se hizo el sorteo de «${g.name}»! Tu sobre te espera`;
  const html = layout({
    title: subject,
    greeting: `¡Llegó el momento, ${e(name)}!`,
    paragraphs: [
      `${e(g.organizerName)} hizo el sorteo de <strong>${e(groupTitle(g))}</strong>. Tu <strong>sobre sellado</strong> ya está listo en la app: ábrelo para descubrir a quién le regalas.`,
      'Ahí mismo verás su lista de deseos. 🤫 Recuerda: ¡es secreto!',
    ],
    details: groupDetails(g),
    cta: { label: 'Abrir mi sobre', url: params.groupUrl },
    footerNote: 'Por privacidad, este correo no incluye el nombre de tu amigo secreto: solo lo verás en la app.',
  });
  const text = plain(`¡Llegó el momento, ${name}!`, [
    `Ya se hizo el sorteo de "${groupTitle(g)}". Abre tu sobre en la app para descubrir a quién le regalas.`,
    `Fecha del intercambio: ${formatExchangeDate(g.exchangeDate)} · Presupuesto: ${formatBudget(g.budgetMin, g.budgetMax, g.currency)}`,
    '',
    params.groupUrl,
  ]);
  return { subject, html, text };
}

export function drawResetEmail(params: { name: string; groupName: string; organizerName: string; groupUrl: string }): MailContent {
  const name = firstName(params.name);
  const subject = `El sorteo de «${params.groupName}» se reinició`;
  const html = layout({
    title: subject,
    greeting: `Hola, ${e(name)}:`,
    paragraphs: [
      `${e(params.organizerName)} reinició el sorteo de <strong>${e(params.groupName)}</strong> (por ejemplo, para sumar a alguien más).`,
      '<strong>La asignación anterior ya no vale.</strong> Te avisaremos cuando se haga el nuevo sorteo para que abras tu nuevo sobre.',
    ],
    cta: { label: 'Ver el grupo', url: params.groupUrl },
  });
  const text = plain(`Hola, ${name}:`, [
    `${params.organizerName} reinició el sorteo de "${params.groupName}". La asignación anterior ya no vale.`,
    'Te avisaremos cuando se haga el nuevo sorteo.',
    '',
    params.groupUrl,
  ]);
  return { subject, html, text };
}

export function revealedEmail(params: { name: string; groupName: string; groupUrl: string }): MailContent {
  const name = firstName(params.name);
  const subject = `🎉 ¡Se revelaron los amigos secretos de «${params.groupName}»!`;
  const html = layout({
    title: subject,
    greeting: `¡Se acabó el misterio, ${e(name)}!`,
    paragraphs: [
      `El organizador reveló quién le regaló a quién en <strong>${e(params.groupName)}</strong>. Entra a la app para ver la lista completa.`,
      '¡Gracias por participar! Esperamos que la parranda haya estado buena.',
    ],
    cta: { label: 'Ver quién era quién', url: params.groupUrl },
  });
  const text = plain(`¡Se acabó el misterio, ${name}!`, [
    `Se revelaron los amigos secretos de "${params.groupName}". Míralos en la app.`,
    '',
    params.groupUrl,
  ]);
  return { subject, html, text };
}

export function removedFromGroupEmail(params: { name: string; groupName: string; organizerName: string }): MailContent {
  const name = firstName(params.name);
  const subject = `Ya no participas en «${params.groupName}»`;
  const html = layout({
    title: subject,
    greeting: `Hola, ${e(name)}:`,
    paragraphs: [
      `${e(params.organizerName)} te retiró del Amigo Secreto <strong>${e(params.groupName)}</strong>. Tu lista de deseos de ese grupo se eliminó.`,
      'Si crees que fue un error, comunícate con el organizador.',
    ],
  });
  const text = plain(`Hola, ${name}:`, [
    `${params.organizerName} te retiró del Amigo Secreto "${params.groupName}".`,
    'Si crees que fue un error, comunícate con el organizador.',
  ]);
  return { subject, html, text };
}

export function groupDeletedEmail(params: { name: string; groupName: string }): MailContent {
  const name = firstName(params.name);
  const subject = `El grupo «${params.groupName}» fue eliminado`;
  const html = layout({
    title: subject,
    greeting: `Hola, ${e(name)}:`,
    paragraphs: [
      `El Amigo Secreto <strong>${e(params.groupName)}</strong> fue eliminado, junto con sus asignaciones y listas de deseos.`,
      'Si fue un error, el organizador puede crear un grupo nuevo e invitarte de nuevo.',
    ],
  });
  const text = plain(`Hola, ${name}:`, [`El Amigo Secreto "${params.groupName}" fue eliminado.`]);
  return { subject, html, text };
}

export function wishCommentEmail(params: {
  name: string;
  groupName: string;
  wishTitle: string;
  fromRole: 'owner' | 'giver';
  preview: string;
  groupUrl: string;
}): MailContent {
  const name = firstName(params.name);
  const fromGiver = params.fromRole === 'giver';
  const subject = fromGiver
    ? `🤫 Tu pana secreto comentó tu deseo «${params.wishTitle}»`
    : `💬 Te respondieron en «${params.wishTitle}»`;
  const intro = fromGiver
    ? `Alguien de <strong>${e(params.groupName)}</strong> que te va a regalar dejó un comentario en tu deseo <strong>${e(params.wishTitle)}</strong>. ¡Nadie sabrá quién es hasta el destape!`
    : `Tu pana respondió en su deseo <strong>${e(params.wishTitle)}</strong> del grupo <strong>${e(params.groupName)}</strong>.`;
  const html = layout({
    title: subject,
    greeting: `¡Epa, ${e(name)}!`,
    paragraphs: [intro],
    highlight: `«${e(params.preview)}»`,
    cta: { label: fromGiver ? 'Responder en la app' : 'Ver el comentario', url: params.groupUrl },
    footerNote: 'Puedes apagar estos correos en tu perfil, en Notificaciones.',
  });
  const text = plain(`¡Epa, ${name}!`, [
    fromGiver
      ? `Tu pana secreto comentó tu deseo "${params.wishTitle}" (${params.groupName}).`
      : `Te respondieron en el deseo "${params.wishTitle}" (${params.groupName}).`,
    `"${params.preview}"`,
    '',
    params.groupUrl,
  ]);
  return { subject, html, text };
}
