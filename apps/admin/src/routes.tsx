import { ReactNode } from 'react';
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
import Configuration from './pages/settings/Configuration';
import { ROLES, type UserRole } from './constants/roles';

type AppChildRoute = {
  path: string;
  element: ReactNode;
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
        path: '/settings',
        element: <Configuration />,
        protected: true,
        allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
      { path: '/force-password-change', element: <ForcePasswordChange />, protected: true },
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
            element: <ProtectedRoute element={child.element as any} allowedRoles={child.allowedRoles} />,
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
