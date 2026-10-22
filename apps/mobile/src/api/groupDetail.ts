import { api, ApiError } from './client';
import type { Currency, GroupStatus, MemberRole } from './groups';

/* ---------------------------------------------------------------- Tipos de la API */

export interface ApiGroupMember {
  userId: string;
  name: string;
  lastName?: string;
  nickname?: string;
  photo: string | null;
  role: MemberRole;
  joinedAt: string;
  hasAlias: boolean;
  /** Solo para el organizador */
  email?: string;
  exclusions?: string[];
}

export interface ApiGroup {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  creatorId: string;
  creatorName: string;
  status: GroupStatus;
  exchangeDate: string;
  currency: Currency;
  budgetMin: number | null;
  budgetMax: number | null;
  maxParticipants: number;
  anonymousClues: boolean;
  location: { name: string; address: string } | null;
  note: string | null;
  inviteCode: string;
  memberCount: number;
  myRole: MemberRole | null;
  myAlias: string | null;
  myAliasEmoji: string | null;
  envelopeOpened: boolean;
  isCreator: boolean;
  drawnAt?: string;
  revealedAt?: string;
  completedAt?: string;
  members: ApiGroupMember[];
  /** Solo en la respuesta de guardar exclusiones */
  drawPossible?: boolean;
}

export interface ApiAssignment {
  groupId: string;
  opened: boolean;
  revealed: boolean;
  receiver: { alias: string; aliasEmoji: string; userId?: string; name?: string; lastName?: string; photo?: string | null };
}

export interface ApiAssignedWish {
  id: string;
  title: string;
  description?: string;
  estimatedPrice: number | null;
  currency?: Currency;
  imageUrl?: string;
  category?: string;
  storeName?: string;
  isFavorite: boolean;
  commentsCount: number;
  unansweredCount: number;
}

export interface ApiRevealPerson {
  userId: string;
  name: string;
  lastName?: string;
  photo?: string | null;
  alias: string;
  aliasEmoji: string;
}

export interface ApiReveal {
  groupId: string;
  giftedTo: ApiRevealPerson;
  giftedBy: ApiRevealPerson;
}

/** Todo lo que necesita el detalle del grupo, en una sola carga */
export interface GroupBundle {
  group: ApiGroup;
  assignment: ApiAssignment | null;
  assignedWishes: ApiAssignedWish[];
  reveal: ApiReveal | null;
}

export const groupKey = (id: string) => `group:${id}`;

const optional = <T>(promise: Promise<T>): Promise<T | null> =>
  promise.catch((error: unknown) => {
    // Sin asignación (p. ej. el sorteo se deshizo mientras tanto) no es un error para la pantalla
    if (error instanceof ApiError && (error.status === 404 || error.status === 409 || error.status === 403)) return null;
    throw error;
  });

export async function fetchGroupBundle(id: string): Promise<GroupBundle> {
  const group = await api<ApiGroup>(`/api/group/${id}`);
  const drawn = group.status !== 'WAITING';
  const revealed = group.status === 'REVEALED' || group.status === 'COMPLETED';
  const [assignment, assigned, reveal] = await Promise.all([
    drawn ? optional(api<ApiAssignment>(`/api/group/${id}/assignment`)) : null,
    drawn ? optional(api<{ results: ApiAssignedWish[] }>(`/api/group/${id}/wishlist/assigned`)) : null,
    revealed ? optional(api<ApiReveal>(`/api/group/${id}/reveal`)) : null,
  ]);
  return { group, assignment, assignedWishes: assigned?.results ?? [], reveal };
}

/* ---------------------------------------------------------------- Acciones */

export interface CreateGroupInput {
  name: string;
  emoji?: string;
  exchangeDate: string;
  currency: Currency;
  budgetMin: number | null;
  budgetMax: number | null;
  maxParticipants: number;
  anonymousClues: boolean;
}

export type UpdateGroupInput = Partial<CreateGroupInput> & {
  location?: { name: string; address: string } | null;
  note?: string | null;
};

export const createGroup = (input: CreateGroupInput) => api<ApiGroup>('/api/group', { method: 'POST', body: input });
export const updateGroup = (id: string, input: UpdateGroupInput) => api<ApiGroup>(`/api/group/${id}`, { method: 'PATCH', body: input });
export const deleteGroup = (id: string) => api<{ ok: boolean }>(`/api/group/${id}`, { method: 'DELETE' });
export const leaveGroup = (id: string) => api<{ ok: boolean }>(`/api/group/${id}/members/me`, { method: 'DELETE' });
export const removeMember = (id: string, userId: string) =>
  api<ApiGroup>(`/api/group/${id}/members/${userId}`, { method: 'DELETE' });
export const setMemberExclusions = (id: string, userId: string, exclusions: string[]) =>
  api<ApiGroup>(`/api/group/${id}/members/${userId}/exclusions`, { method: 'PUT', body: { exclusions, mutual: false } });
export const drawGroup = (id: string) => api<ApiGroup>(`/api/group/${id}/draw`, { method: 'POST' });
export const resetDraw = (id: string) => api<ApiGroup>(`/api/group/${id}/draw`, { method: 'DELETE' });
export const revealGroup = (id: string) => api<ApiGroup>(`/api/group/${id}/reveal`, { method: 'POST' });
export const completeGroup = (id: string) => api<ApiGroup>(`/api/group/${id}/complete`, { method: 'POST' });
export const openEnvelope = (id: string) => api<{ opened: boolean }>(`/api/group/${id}/envelope/open`, { method: 'POST' });
