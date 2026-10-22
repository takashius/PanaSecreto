export type AliasGender = 'M' | 'F' | 'N';
export const ALIAS_GENDERS: AliasGender[] = ['M', 'F', 'N'];

export interface AliasSuggestion {
  id: string;
  text: string;
  gender: AliasGender;
  emoji?: string;
  active: boolean;
}

export interface AliasListResponse {
  results: AliasSuggestion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  byGender: Record<AliasGender, { total: number; active: number }>;
}

export interface AliasInput {
  text: string;
  gender: AliasGender;
  emoji?: string;
  active?: boolean;
}

export interface CustomAliasRow {
  groupId: string;
  groupName: string;
  status: 'WAITING' | 'LOCKED' | 'REVEALED' | 'COMPLETED';
  alias: string;
  aliasEmoji?: string;
  flagged: boolean;
  user: { id: string; name: string; email?: string };
}

/** Pantallas de la app donde puede salir un tip (mismas claves que el backend) */
export const TIP_SCREENS = [
  'general',
  'grupos',
  'grupo.resumen',
  'sobre.sellado',
  'sobre.lista',
  'deseo.detalle',
  'deseo.formulario',
  'deseos',
  'chat.lista',
  'chat.sala',
  'notificaciones',
  'unirse',
  'exclusiones',
  'revelacion',
] as const;

export type TipScreen = (typeof TIP_SCREENS)[number];

export interface Tip {
  id: string;
  text: string;
  screens: TipScreen[];
  active: boolean;
  weight: number;
}

export interface TipListResponse {
  results: Tip[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  screens: TipScreen[];
  activePerScreen: Record<TipScreen, number>;
}

export interface TipInput {
  text: string;
  screens: TipScreen[];
  active?: boolean;
  weight?: number;
}

export const TIP_MAX_LENGTH = 220;
export const ALIAS_MIN_LENGTH = 3;
export const ALIAS_MAX_LENGTH = 30;
