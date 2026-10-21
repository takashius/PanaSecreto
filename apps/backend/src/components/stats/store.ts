import { GroupStatusEnum } from '@panasecreto/shared';
import type { Model } from 'mongoose';
import { User } from '../user/model';
import { Group } from '../group/model';
import { Wish } from '../wishlist/model';
import { ALL_ROLES } from '../../config/roles';
import { StoreResponse } from '../../types/general';

/** Zona horaria para agrupar por día (Venezuela por defecto) */
const REPORT_TZ = process.env.REPORT_TIMEZONE || 'America/Caracas';
const DAYS = 30;

function dayKey(date: Date): string {
  // YYYY-MM-DD en la zona horaria del reporte
  return new Intl.DateTimeFormat('en-CA', { timeZone: REPORT_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function lastDays(n: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) keys.push(dayKey(new Date(Date.now() - i * 864e5)));
  return keys;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- acepta cualquier modelo con createdAt
async function countByDay(model: Model<any>, since: Date): Promise<Map<string, number>> {
  const rows: Array<{ _id: string; count: number }> = await model.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: REPORT_TZ } }, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id, r.count]));
}

export async function getDashboardStats(): Promise<StoreResponse> {
  try {
    const since = new Date(Date.now() - DAYS * 864e5);
    const now = new Date();

    const [
      usersTotal,
      usersActive,
      usersNew,
      rolesAgg,
      groupsTotal,
      groupsNew,
      statusAgg,
      membersAgg,
      wishesTotal,
      signupsMap,
      groupsMap,
      upcoming,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ $or: [{ active: true }, { active: { $exists: false } }] }),
      User.countDocuments({ createdAt: { $gte: since } }),
      User.aggregate([{ $unwind: '$role' }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
      Group.countDocuments({}),
      Group.countDocuments({ createdAt: { $gte: since } }),
      Group.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Group.aggregate([{ $group: { _id: null, members: { $sum: { $size: '$members' } } } }]),
      Wish.countDocuments({}),
      countByDay(User, since),
      countByDay(Group, since),
      Group.find({ exchangeDate: { $gte: now }, status: { $ne: GroupStatusEnum.COMPLETED } })
        .sort({ exchangeDate: 1 })
        .limit(6)
        .select('name emoji exchangeDate status members')
        .lean(),
    ]);

    const byRole = Object.fromEntries(ALL_ROLES.map((r) => [r, 0])) as Record<string, number>;
    for (const r of rolesAgg) if (r._id in byRole) byRole[r._id] = r.count;

    const byStatus = Object.fromEntries(Object.values(GroupStatusEnum).map((s) => [s, 0])) as Record<string, number>;
    for (const s of statusAgg) if (s._id in byStatus) byStatus[s._id] = s.count;

    const totalMembers = membersAgg[0]?.members ?? 0;

    return {
      status: 200,
      message: {
        generatedAt: now,
        timezone: REPORT_TZ,
        users: {
          total: usersTotal,
          active: usersActive,
          inactive: usersTotal - usersActive,
          newLast30d: usersNew,
          byRole,
        },
        groups: {
          total: groupsTotal,
          newLast30d: groupsNew,
          byStatus,
          totalMembers,
          avgMembers: groupsTotal ? Math.round((totalMembers / groupsTotal) * 10) / 10 : 0,
        },
        wishes: { total: wishesTotal },
        activityByDay: lastDays(DAYS).map((date) => ({
          date,
          signups: signupsMap.get(date) ?? 0,
          groups: groupsMap.get(date) ?? 0,
        })),
        upcomingExchanges: upcoming.map((g) => ({
          id: String(g._id),
          name: g.name,
          emoji: g.emoji,
          exchangeDate: g.exchangeDate,
          status: g.status,
          memberCount: g.members.length,
        })),
      },
    };
  } catch (error) {
    return { status: 500, message: 'Error al calcular las estadísticas.', detail: error };
  }
}
