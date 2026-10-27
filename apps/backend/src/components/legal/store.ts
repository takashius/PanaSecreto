import Legal from './model';
import ServiceCancellation from './serviceCancellation.model';
import { DEFAULT_BODIES, LEGAL_KEYS, LEGAL_TITLES, type LegalKey } from './defaults';
import { parseMarkdownSections } from './markdown';
import { StoreResponse } from '../../types/general';
import config from '../../config/commons';
import { sendMail } from '../../services/mail';

export async function getLegalDoc(key: LegalKey) {
  const defaults = DEFAULT_BODIES[key];
  const existing = await Legal.findOneAndUpdate(
    { key },
    {
      $setOnInsert: {
        key,
        version: 1,
        body: { es: defaults.es, en: defaults.en },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return existing;
}

export async function seedLegalDocuments(): Promise<void> {
  for (const key of LEGAL_KEYS) {
    await getLegalDoc(key);
  }
}

function serializePublic(doc: Awaited<ReturnType<typeof getLegalDoc>>, lang: 'es' | 'en') {
  const key = doc.key as LegalKey;
  const raw = lang === 'en' ? doc.body?.en : doc.body?.es;
  const fallback = DEFAULT_BODIES[key].es;
  const markdown = (raw || fallback).trim();
  const title = lang === 'en' ? LEGAL_TITLES[key].en : LEGAL_TITLES[key].es;
  return {
    key,
    title,
    version: doc.version || 1,
    updatedAt: doc.updatedAt,
    lang,
    markdown,
    sections: parseMarkdownSections(markdown),
  };
}

export async function readPublicLegal(key: LegalKey, langRaw?: string): Promise<StoreResponse> {
  try {
    const lang = langRaw === 'en' ? 'en' : 'es';
    const doc = await getLegalDoc(key);
    return { status: 200, message: serializePublic(doc, lang) };
  } catch (e) {
    return { status: 500, message: 'Error al cargar el documento legal.', detail: e };
  }
}

export async function readAdminLegal(key: LegalKey): Promise<StoreResponse> {
  try {
    const doc = await getLegalDoc(key);
    const defaults = DEFAULT_BODIES[key];
    return {
      status: 200,
      message: {
        key,
        version: doc.version || 1,
        updatedAt: doc.updatedAt,
        body: {
          es: doc.body?.es || defaults.es,
          en: doc.body?.en || defaults.en,
        },
      },
    };
  } catch (e) {
    return { status: 500, message: 'Error al cargar el documento legal.', detail: e };
  }
}

export async function updateLegalDocument(key: LegalKey, payload: unknown): Promise<StoreResponse> {
  try {
    const bodyPayload = payload as { body?: { es?: string; en?: string } };
    const es = typeof bodyPayload?.body?.es === 'string' ? bodyPayload.body.es.trim() : '';
    const en = typeof bodyPayload?.body?.en === 'string' ? bodyPayload.body.en.trim() : '';
    if (!es || !en) {
      return { status: 400, message: 'Debes indicar el texto en español e inglés.' };
    }
    const doc = await getLegalDoc(key);
    doc.body = { es, en };
    doc.version = (doc.version || 1) + 1;
    await doc.save();
    return await readAdminLegal(key);
  } catch (e) {
    return { status: 400, message: 'No se pudo actualizar el documento legal.', detail: e };
  }
}

export async function getCurrentLegalVersions(): Promise<{ terms: number; privacy: number }> {
  const [termsDoc, privacyDoc] = await Promise.all([getLegalDoc('terms'), getLegalDoc('privacy')]);
  return {
    terms: termsDoc.version || 1,
    privacy: privacyDoc.version || 1,
  };
}

const REASON_LABELS: Record<string, string> = {
  noLongerUse: 'Ya no uso el servicio',
  privacy: 'Preocupaciones de privacidad',
  security: 'Preocupaciones de seguridad',
  other: 'Otro',
};

export async function submitServiceCancellation(body: unknown): Promise<StoreResponse> {
  try {
    const data = body as Record<string, unknown>;
    const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : '';
    const lastName = typeof data.lastName === 'string' ? data.lastName.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
    const nationalId = typeof data.nationalId === 'string' ? data.nationalId.trim() : '';
    const reason = typeof data.reason === 'string' ? data.reason.trim() : '';
    const additionalInfo = typeof data.additionalInfo === 'string' ? data.additionalInfo.trim() : '';
    const confirmed = data.confirmed === true;

    if (!firstName || !lastName || !email || !phone || !nationalId || !reason) {
      return { status: 400, message: 'Completa todos los campos obligatorios.' };
    }
    if (!confirmed) {
      return { status: 400, message: 'Debes confirmar que entiendes las consecuencias de la baja.' };
    }

    await ServiceCancellation.create({
      firstName,
      lastName,
      email,
      phone,
      nationalId,
      reason,
      additionalInfo: additionalInfo || undefined,
      confirmed: true,
    });

    const adminEmail = config.userAdminEmail;
    const reasonLabel = REASON_LABELS[reason] || reason;
    const html = `
      <p>Se recibió una solicitud de <strong>baja de servicio</strong> en EntrePanas.</p>
      <ul>
        <li><strong>Nombre:</strong> ${firstName} ${lastName}</li>
        <li><strong>Correo:</strong> ${email}</li>
        <li><strong>Teléfono:</strong> ${phone}</li>
        <li><strong>Documento:</strong> ${nationalId}</li>
        <li><strong>Motivo:</strong> ${reasonLabel}</li>
        ${additionalInfo ? `<li><strong>Información adicional:</strong> ${additionalInfo}</li>` : ''}
      </ul>
    `;
    await sendMail({
      to: { email: adminEmail, name: 'Administración EntrePanas' },
      subject: `[EntrePanas] Solicitud de baja — ${email}`,
      html,
      text: `Baja de servicio: ${firstName} ${lastName} (${email}) — ${reasonLabel}`,
    }).catch((err) => console.warn('[legal] No se pudo enviar correo de baja:', err));

    return { status: 201, message: { ok: true } };
  } catch (e) {
    return { status: 500, message: 'No se pudo registrar la solicitud.', detail: e };
  }
}
