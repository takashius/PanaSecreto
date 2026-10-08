import { Document, Model } from 'mongoose';
import { UserRole } from '../config/roles';

export interface IUserToken {
  token: string;
  date?: Date;
}

export interface IUser {
  name: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  email: string;
  photo?: string;
  role: UserRole | UserRole[];
  password?: string;
  active: boolean;
  date: Date;
  forcePasswordChangeOnNextLogin?: boolean;
  tokens: IUserToken[];
  recoveryCode?: number;
  recoveryCodeExpires?: Date;
}

export interface IUserDocument extends IUser, Document {
  generateAuthToken(): Promise<string>;
}

export interface IUserModel extends Model<IUserDocument> {
  findByCredentials(email: string, password: string): Promise<IUserDocument>;
}

export interface ManagedUser {
  _id: string;
  name: string;
  lastName?: string;
  middleName?: string;
  email: string;
  phone?: string;
  photo?: string | null;
  role: UserRole | string;
  active: boolean;
  date?: string;
  forcePasswordChangeOnNextLogin?: boolean;
}

export interface UserListResponse {
  results: ManagedUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  role: UserRole[];
  token: string;
  forcePasswordChangeOnNextLogin?: boolean;
}
