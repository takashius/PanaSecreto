import { api } from './client';

export type LegalDocKey = 'terms' | 'privacy';

export interface LegalSection {
  id: string;
  title: string;
  body: string;
}

export interface PublicLegalDoc {
  key: LegalDocKey;
  title: string;
  version: number;
  updatedAt?: string;
  lang: 'es' | 'en';
  markdown: string;
  sections: LegalSection[];
}

export const fetchPublicLegal = (key: LegalDocKey, lang = 'es') =>
  api<PublicLegalDoc>(`/api/legal/${key}?lang=${lang.startsWith('en') ? 'en' : 'es'}`, { auth: false });

export const acceptLegal = () => api<Record<string, unknown>>('/api/user/accept-legal', { method: 'POST' });
