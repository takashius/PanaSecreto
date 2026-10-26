import type { UserRole } from '../constants/roles';

export interface ManagedUser {
  _id: string;
  name: string;
  lastName?: string;
  middleName?: string;
  email: string;
  phone?: string;
  photo?: string | null;
  role: UserRole | string | string[];
  active: boolean;
  date?: string;
  forcePasswordChangeOnNextLogin?: boolean;
  nickname?: string;
  gender?: 'M' | 'F' | 'N';
  notifyEmail?: boolean;
  notifyComments?: boolean;
  notifyPush?: boolean;
}

export interface UserListResponse {
  results: ManagedUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateUserRequest {
  name: string;
  lastName?: string;
  middleName?: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
  active?: boolean;
}
