import { DashboardOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';
import { ROLES, normalizeRole, type UserRole } from '../constants/roles';

export interface MenuItem {
  key: string;
  labelKey: string;
  path: string;
  icon?: any;
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
