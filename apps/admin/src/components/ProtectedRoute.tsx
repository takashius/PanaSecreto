import { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@context/useAuth';
import { canAccessWeb, normalizeRole, type UserRole } from '../constants/roles';

interface ProtectedRouteProps {
  element: ReactElement;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ element, allowedRoles }: ProtectedRouteProps) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !canAccessWeb(user.role)) {
    return <Navigate to="/login" state={{ webAccessDenied: true }} replace />;
  }

  const role = normalizeRole(user.role);
  if (allowedRoles && allowedRoles.length > 0 && role) {
    if (role !== 'SUPER_ADMIN' && !allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return element;
}
