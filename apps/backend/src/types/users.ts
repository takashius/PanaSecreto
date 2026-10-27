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
  nickname?: string;
  gender?: 'M' | 'F' | 'N';
  notifyEmail?: boolean;
  notifyComments?: boolean;
  /** false = no quiere notificaciones push en el teléfono */
  notifyPush?: boolean;
  role: UserRole | UserRole[];
  password?: string;
  active: boolean;
  date: Date;
  forcePasswordChangeOnNextLogin?: boolean;
  tokens: IUserToken[];
  recoveryCode?: number;
  recoveryCodeExpires?: Date;
  recoveryAttempts?: number;
  /** Identificador de la cuenta de Google vinculada (sub) */
  googleId?: string;
  /** false si la cuenta se creó con Google y aún no tiene contraseña propia */
  hasPassword?: boolean;
  termsAcceptedVersion?: number;
  termsAcceptedAt?: Date;
  privacyAcceptedVersion?: number;
  privacyAcceptedAt?: Date;
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
