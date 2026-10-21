/**
 * Tipos de sesión y borradores usados por las pantallas maquetadas.
 * Se reemplazarán por los tipos de @panasecreto/shared al conectar la app con la API.
 */
export interface SessionUser {
  identifier?: string;
  fullname?: string;
  username?: string;
  email?: string;
  phone?: string;
}

export interface CreatedGroupDraft {
  name: string;
  date: string;
  currency: 'USD' | 'VES';
  minBudget: string | null;
  maxBudget: string | null;
  participantsLimit: number;
  anonymousClues: boolean;
  code: string;
}
