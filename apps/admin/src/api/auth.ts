import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import ERDEAxios from './ERDEAxios';
import type { LoginResponse } from '@app-types/auth';

export interface LoginPayload {
  email: string;
  password: string;
  client?: 'web' | 'mobile';
}

export interface RecoveryPayload {
  code: number;
  email: string;
  newPass: string;
}

export const useLogin = (): UseMutationResult<LoginResponse, unknown, LoginPayload> => {
  return useMutation({
    mutationFn: async (data: LoginPayload) => {
      const response = await ERDEAxios.post<LoginResponse>('/user/login', {
        ...data,
        client: data.client ?? 'web',
      });
      return response.data;
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: async (): Promise<unknown> => {
      const response = await ERDEAxios.post('/user/logout');
      return response.data;
    },
  });
};

export const useRecoveryOne = (): UseMutationResult<unknown, unknown, string> => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await ERDEAxios.get(`/user/recovery/${encodeURIComponent(email)}`);
      return response.data;
    },
  });
};

export const useRecoveryTwo = (): UseMutationResult<unknown, unknown, RecoveryPayload> => {
  return useMutation({
    mutationFn: async (payload: RecoveryPayload) => {
      const response = await ERDEAxios.post('/user/recovery', payload);
      return response.data;
    },
  });
};

export const useChangePasswordRequired = (): UseMutationResult<unknown, unknown, string> => {
  return useMutation({
    mutationFn: async (password: string) => {
      const response = await ERDEAxios.post('/user/change_password_required', { password });
      return response.data;
    },
  });
};
