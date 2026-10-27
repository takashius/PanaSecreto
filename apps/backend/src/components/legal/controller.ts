import {
  readAdminLegal,
  readPublicLegal,
  submitServiceCancellation,
  updateLegalDocument,
} from './store';
import type { LegalKey } from './defaults';
import { StoreResponse } from '../../types/general';

const fail = (e: unknown): StoreResponse => ({
  status: 500,
  message: 'Error inesperado.',
  detail: e,
});

function parseKey(raw: unknown): LegalKey | null {
  return raw === 'terms' || raw === 'privacy' ? raw : null;
}

export async function getPublicLegal(keyRaw: unknown, lang?: string) {
  const key = parseKey(keyRaw);
  if (!key) return { status: 404, message: 'Documento no encontrado.' };
  try {
    return await readPublicLegal(key, lang);
  } catch (e) {
    return fail(e);
  }
}

export async function getAdminLegal(keyRaw: unknown) {
  const key = parseKey(keyRaw);
  if (!key) return { status: 404, message: 'Documento no encontrado.' };
  try {
    return await readAdminLegal(key);
  } catch (e) {
    return fail(e);
  }
}

export async function saveLegal(keyRaw: unknown, payload: unknown) {
  const key = parseKey(keyRaw);
  if (!key) return { status: 404, message: 'Documento no encontrado.' };
  try {
    return await updateLegalDocument(key, payload);
  } catch (e) {
    return fail(e);
  }
}

export async function postServiceCancellation(body: unknown) {
  try {
    return await submitServiceCancellation(body);
  } catch (e) {
    return fail(e);
  }
}
