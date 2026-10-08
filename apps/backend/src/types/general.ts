import { Request } from 'express';
import { UserRole } from '../config/roles';

export interface StoreResponse<T = any> {
  status: number;
  message: T;
  detail?: any;
}

export interface AuthUserInfo {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: UserRole[];
  photo?: string;
  active: boolean;
}

export interface IGetUserAuthInfoRequest extends Request {
  user?: AuthUserInfo;
  token?: string;
  userIp?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUserInfo;
  token: string;
  userIp: string;
}
