import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@context/useAuth';
import { canAccessWeb, normalizeRole, type UserRole } from '../constants/roles';

interface ProtectedRouteProps {
  element: ReactElement;
  allowedRoles?: UserRole[];
}

export const FORCE_PASSWORD_PATH = '/force-password-change';

export default function ProtectedRoute({ element, allowedRoles }: ProtectedRouteProps) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !canAccessWeb(user.role)) {
    return <Navigate to="/login" state={{ webAccessDenied: true }} replace />;
  }

  // Cambio de contraseña obligatorio: no se puede usar el panel hasta completarlo
  const mustChangePassword = Boolean(user.forcePasswordChangeOnNextLogin);
  if (mustChangePassword && location.pathname !== FORCE_PASSWORD_PATH) {
    return <Navigate to={FORCE_PASSWORD_PATH} replace />;
  }
  if (!mustChangePassword && location.pathname === FORCE_PASSWORD_PATH) {
    return <Navigate to="/" replace />;
  }

  const role = normalizeRole(user.role);
  if (allowedRoles && allowedRoles.length > 0 && role) {
    if (role !== 'SUPER_ADMIN' && !allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return element;
}
