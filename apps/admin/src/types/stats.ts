import type { GroupStatus } from './groups';

export interface DashboardStats {
  generatedAt: string;
  timezone: string;
  users: {
    total: number;
    active: number;
    inactive: number;
    newLast30d: number;
    byRole: Record<string, number>;
  };
  groups: {
    total: number;
    newLast30d: number;
    byStatus: Record<GroupStatus, number>;
    totalMembers: number;
    avgMembers: number;
  };
  wishes: { total: number };
  activityByDay: Array<{ date: string; signups: number; groups: number }>;
  upcomingExchanges: Array<{
    id: string;
    name: string;
    emoji?: string;
    exchangeDate: string;
    status: GroupStatus;
    memberCount: number;
  }>;
}
