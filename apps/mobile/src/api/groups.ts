import { api } from './client';

export type GroupStatus = 'WAITING' | 'LOCKED' | 'REVEALED' | 'COMPLETED';
export type MemberRole = 'CREATOR' | 'PARTICIPANT';
export type Currency = 'USD' | 'VES';

/** Grupo tal como lo lista GET /api/group (mismo contrato que GroupSummary del backend) */
export interface GroupSummary {
  id: string;
  name: string;
  emoji?: string;
  status: GroupStatus;
  exchangeDate: string;
  currency: Currency;
  budgetMin: number | null;
  budgetMax: number | null;
  maxParticipants: number;
  memberCount: number;
  myRole: MemberRole;
  creatorName: string;
  hasAssignment: boolean;
  myAlias: string | null;
  myAliasEmoji: string | null;
  envelopeOpened: boolean;
  locationName: string | null;
  /** Cuántos deseos tengo en este grupo */
  myWishCount: number;
  drawnAt: string | null;
  revealedAt: string | null;
  completedAt: string | null;
  memberPreview: Array<{ initials: string; photo: string | null; isMe: boolean }>;
}

export const MY_GROUPS_KEY = 'groups:mine';

export const fetchMyGroups = () =>
  api<{ results: GroupSummary[]; total: number }>('/api/group?scope=all').then((r) => r.results);
