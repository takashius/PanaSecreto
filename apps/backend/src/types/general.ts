import { Request } from 'express';
import { UserRole } from '../config/roles';

export interface StoreResponse<T = unknown> {
  status: number;
  message: T;
  detail?: unknown;
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

export interface UploadedImage {
  url: string;
  publicId: string;
}

export interface IGetUserAuthInfoRequest extends Request {
  user?: AuthUserInfo;
  token?: string;
  userIp?: string;
  /** Imágenes subidas por el middleware uploadImages, por nombre de campo */
  uploads?: Record<string, UploadedImage>;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUserInfo;
  token: string;
  userIp: string;
}
