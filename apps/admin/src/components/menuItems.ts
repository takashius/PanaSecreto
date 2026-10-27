import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  GiftOutlined,
  SmileOutlined,
  BulbOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import type { ComponentType } from 'react';
import { ROLES, normalizeRole, type UserRole } from '../constants/roles';

export interface MenuItem {
  key: string;
  labelKey: string;
  path: string;
  icon?: ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
  match?: 'exact' | 'startsWith';
  children?: MenuItem[];
}

export const allMenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    labelKey: 'menu.dashboard',
    path: '/',
    icon: DashboardOutlined,
    match: 'exact',
  },
  {
    key: 'users',
    labelKey: 'menu.usersManagement',
    path: '/users-management',
    icon: UserOutlined,
    allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    match: 'startsWith',
  },
  {
    key: 'groups',
    labelKey: 'menu.groups',
    path: '/groups',
    icon: GiftOutlined,
    allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    match: 'startsWith',
  },
  {
    key: 'aliases',
    labelKey: 'menu.aliases',
    path: '/aliases',
    icon: SmileOutlined,
    allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    match: 'startsWith',
  },
  {
    key: 'tips',
    labelKey: 'menu.tips',
    path: '/tips',
    icon: BulbOutlined,
    allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    match: 'startsWith',
  },
  {
    key: 'push',
    labelKey: 'menu.push',
    path: '/push',
    icon: NotificationOutlined,
    allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    match: 'startsWith',
  },
  {
    key: 'settings',
    labelKey: 'menu.settings',
    path: '/settings',
    icon: SettingOutlined,
    allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    match: 'startsWith',
  },
];

export function getMenuItemsForRole(userRole?: string | string[] | null): MenuItem[] {
  const role = normalizeRole(userRole);
  if (!role) return [];

  return allMenuItems.filter((item) => {
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
    if (role === 'SUPER_ADMIN') return true;
    return item.allowedRoles.includes(role);
  });
}
