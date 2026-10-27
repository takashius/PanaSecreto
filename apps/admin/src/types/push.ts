/** Avisos push enviados desde el panel */
export type PushAudience = 'all' | 'group' | 'users';

export const PUSH_TITLE_MAX = 80;
export const PUSH_BODY_MAX = 240;

export interface PushStats {
  devices: number;
  android: number;
  ios: number;
  usersWithDevice: number;
  /** Con teléfono, cuenta activa y push encendidas */
  reachable: number;
}

export interface PushAudiencePreview {
  selected: number;
  withDevice: number;
  reachable: number;
  optedOut: number;
  devices: number;
  groupName: string | null;
}

export interface PushSendInput {
  audience: PushAudience;
  groupId?: string;
  userIds?: string[];
  title: string;
  body: string;
  inApp: boolean;
}

export interface PushCampaign {
  id: string;
  title: string;
  body: string;
  audience: PushAudience;
  groupId: string | null;
  groupName: string | null;
  users: Array<{ id: string; name: string; email: string }>;
  inApp: boolean;
  sentByName: string | null;
  selected: number;
  reachable: number;
  devices: number;
  sent: number;
  createdAt: string;
}

export interface PushCampaignListResponse {
  results: PushCampaign[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
