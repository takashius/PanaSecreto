export type GroupStatus = 'WAITING' | 'LOCKED' | 'REVEALED' | 'COMPLETED';
export type MemberRole = 'CREATOR' | 'PARTICIPANT';

export const GROUP_STATUSES: GroupStatus[] = ['WAITING', 'LOCKED', 'REVEALED', 'COMPLETED'];

export interface AdminGroupRow {
  id: string;
  name: string;
  emoji?: string;
  status: GroupStatus;
  inviteCode: string;
  exchangeDate: string;
  currency: string;
  budgetMin: number | null;
  budgetMax: number | null;
  maxParticipants: number;
  memberCount: number;
  creator: { id: string; name: string; email?: string };
  createdAt: string;
}

export interface AdminGroupListResponse {
  results: AdminGroupRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GroupMemberView {
  userId: string;
  name: string;
  lastName?: string;
  photo?: string | null;
  email?: string;
  role: MemberRole;
  joinedAt: string;
  exclusions?: string[];
  nickname?: string;
  /** Si ya eligió alias (nunca se muestra cuál, para no asociarlo a la persona) */
  hasAlias?: boolean;
}

export interface GroupLocation {
  name: string;
  address?: string;
}

export interface GroupDetail {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  creatorId: string;
  creatorName: string;
  status: GroupStatus;
  exchangeDate: string;
  currency: string;
  budgetMin: number | null;
  budgetMax: number | null;
  maxParticipants: number;
  anonymousClues: boolean;
  location?: GroupLocation | null;
  note?: string | null;
  inviteCode: string;
  memberCount: number;
  drawnAt?: string;
  revealedAt?: string;
  completedAt?: string;
  members: GroupMemberView[];
  createdAt: string;
  updatedAt: string;
}
