import type { ReactElement, ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import Layout from '@components/Layout';
import RootAuth from '@components/RootAuth';
import ProtectedRoute from '@components/ProtectedRoute';
import Error404 from '@pages/error/Error404';
import Login from '@pages/auth/Login';
import RecoverPassword from '@pages/auth/RecoverPassword';
import RecoveryStep2 from '@pages/auth/RecoveryStep2';
import ForcePasswordChange from '@pages/auth/ForcePasswordChange';
import Dashboard from '@pages/dashboard/Dashboard';
import UserList from '@pages/users/UserList';
import UserDetail from '@pages/users/UserDetail';
import GroupList from '@pages/groups/GroupList';
import GroupDetail from '@pages/groups/GroupDetail';
import AliasList from '@pages/aliases/AliasList';
import TipList from '@pages/tips/TipList';
import Configuration from './pages/settings/Configuration';
import Profile from './pages/profile/Profile';
import { ROLES, type UserRole } from './constants/roles';

type AppChildRoute = {
  path: string;
  element: ReactElement;
  protected?: boolean;
  allowedRoles?: UserRole[];
};

type AppRoute = {
  path: string;
  element: ReactNode;
  errorElement?: ReactNode;
  children?: AppChildRoute[];
};

export const routes: AppRoute[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <Error404 />,
    children: [
      { path: '/', element: <Dashboard />, protected: true },
      {
        path: '/users-management',
        element: <UserList />,
        protected: true,
        allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
      {
        path: '/users-management/:id',
        element: <UserDetail />,
        protected: true,
        allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
      {
        path: '/groups',
        element: <GroupList />,
        protected: true,
        allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
      {
        path: '/groups/:id',
        element: <GroupDetail />,
        protected: true,
        allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
      {
        path: '/aliases',
        element: <AliasList />,
        protected: true,
        allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
      {
        path: '/tips',
        element: <TipList />,
        protected: true,
        allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
      {
        path: '/settings',
        element: <Configuration />,
        protected: true,
        allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
      { path: '/profile', element: <Profile />, protected: true },
    ],
  },
  {
    path: '/',
    element: <RootAuth />,
    errorElement: <Error404 />,
    children: [
      { path: '/login', element: <Login />, protected: false },
      { path: '/recover-password', element: <RecoverPassword />, protected: false },
      { path: '/recover-password/step2', element: <RecoveryStep2 />, protected: false },
      // Pantalla completa (sin menú lateral) pero requiere sesión
      { path: '/force-password-change', element: <ForcePasswordChange />, protected: true },
    ],
  },
];

export const protectedRoutes: RouteObject[] = routes.map((route) => {
  if (route.children) {
    return {
      path: route.path,
      element: route.element,
      errorElement: route.errorElement,
      children: route.children.map((child) => {
        if (child.protected) {
          return {
            path: child.path,
            element: <ProtectedRoute element={child.element} allowedRoles={child.allowedRoles} />,
          };
        }
        return {
          path: child.path,
          element: child.element,
        };
      }),
    };
  }
  return {
    path: route.path,
    element: route.element,
    errorElement: route.errorElement,
  };
});
