import type { UserRole } from '../constants/roles';

export interface AuthUser {
  _id: string;
  name: string;
  lastName?: string;
  phone?: string;
  email: string;
  photo?: string;
  date?: string;
  role: UserRole | string | string[];
  forcePasswordChangeOnNextLogin?: boolean;
}

export interface LoginResponse extends Omit<AuthUser, 'role'> {
  role: UserRole | string | string[];
  token: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (userData: LoginResponse) => void;
  logout: () => void;
  updateUser: (updated: Partial<AuthUser>) => void;
  getUser: () => AuthUser | null;
  hasWebAccess: () => boolean;
}
