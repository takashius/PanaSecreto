import config from '../config/commons';

export interface MailMessage {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
  /** Identificador para rastrear el envío en el panel de Mailjet */
  customId?: string;
}

export interface MailResult {
  ok: boolean;
  transport: 'mailjet' | 'log';
  error?: string;
}

export interface BatchResult {
  sent: number;
  failed: number;
  transport: 'mailjet' | 'log';
}

const MAILJET_SEND_URL = 'https://api.mailjet.com/v3.1/send';
/** Mailjet acepta hasta 50 mensajes por llamada */
const MAILJET_BATCH_SIZE = 50;

/** Registro en memoria de lo enviado con transport 'log' (para tests y depuración) */
export const mailLog: Array<{ to: string; subject: string; text: string; customId?: string }> = [];
const MAIL_LOG_MAX = 500;

function toMailjet(message: MailMessage) {
  const { fromEmail, fromName } = config.mail;
  return {
    From: { Email: fromEmail, Name: fromName },
    To: [{ Email: message.to.email, Name: message.to.name || message.to.email }],
    Subject: message.subject,
    TextPart: message.text,
    HTMLPart: message.html,
    ...(message.customId ? { CustomID: message.customId } : {}),
  };
}

interface MailjetMessageResult {
  Status?: string;
  Errors?: Array<{ ErrorMessage?: string }>;
}

/** Envía un lote (≤ 50) a Mailjet. Devuelve el estado de cada mensaje, en orden. */
async function postToMailjet(messages: MailMessage[]): Promise<Array<{ ok: boolean; error?: string }>> {
  const { fromEmail, mailjetPublicKey, mailjetPrivateKey } = config.mail;
  if (!mailjetPublicKey || !mailjetPrivateKey || !fromEmail) {
    const error = 'Mailjet no está configurado (MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE y MAIL_FROM_EMAIL son obligatorios).';
    console.error(`[mail] ${error}`);
    return messages.map(() => ({ ok: false, error }));
  }
  try {
    const auth = Buffer.from(`${mailjetPublicKey}:${mailjetPrivateKey}`).toString('base64');
    const response = await fetch(MAILJET_SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ Messages: messages.map(toMailjet) }),
      signal: AbortSignal.timeout(15000),
    });
    const body = (await response.json().catch(() => ({}))) as { Messages?: MailjetMessageResult[]; ErrorMessage?: string };
    return messages.map((m, i) => {
      const r = body.Messages?.[i];
      if (response.ok && r?.Status === 'success') return { ok: true };
      const error = r?.Errors?.[0]?.ErrorMessage || body.ErrorMessage || `HTTP ${response.status}`;
      console.error(`[mail] Mailjet rechazó el envío a ${m.to.email}: ${error}`);
      return { ok: false, error };
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[mail] Error de red con Mailjet: ${error}`);
    return messages.map(() => ({ ok: false, error }));
  }
}

function logMessage(message: MailMessage) {
  mailLog.push({ to: message.to.email, subject: message.subject, text: message.text, customId: message.customId });
  if (mailLog.length > MAIL_LOG_MAX) mailLog.splice(0, mailLog.length - MAIL_LOG_MAX);
  if (config.nodeEnv !== 'test') {
    console.log(`[mail:log] Para: ${message.to.email} | Asunto: ${message.subject}`);
  }
}

/**
 * Envía un correo transaccional.
 * - transport 'mailjet': API v3.1 de Mailjet.
 * - transport 'log': lo registra en memoria/consola (desarrollo y tests).
 * Nunca lanza: devuelve { ok: false, error } para que el flujo que llama decida.
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  const { transport } = config.mail;
  if (transport === 'log') {
    logMessage(message);
    return { ok: true, transport };
  }
  const [result] = await postToMailjet([message]);
  return { ...result, transport };
}

/** Envía muchos correos en lotes de 50 (una llamada a Mailjet por lote). Nunca lanza. */
export async function sendMailBatch(messages: MailMessage[]): Promise<BatchResult> {
  const { transport } = config.mail;
  if (messages.length === 0) return { sent: 0, failed: 0, transport };
  if (transport === 'log') {
    messages.forEach(logMessage);
    return { sent: messages.length, failed: 0, transport };
  }
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < messages.length; i += MAILJET_BATCH_SIZE) {
    const results = await postToMailjet(messages.slice(i, i + MAILJET_BATCH_SIZE));
    for (const r of results) {
      if (r.ok) sent++;
      else failed++;
    }
  }
  return { sent, failed, transport };
}
