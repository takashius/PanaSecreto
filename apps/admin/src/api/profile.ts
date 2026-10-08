import { useQuery, useMutation, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import ERDEAxios from './ERDEAxios';
import type { AuthUser } from '@app-types/auth';

export interface UpdateProfilePayload {
  name?: string;
  lastName?: string;
  phone?: string;
  photo?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  ok: boolean;
  message: string;
}

export const useProfile = (): UseQueryResult<AuthUser, unknown> => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await ERDEAxios.get<AuthUser>('/user/me');
      return response.data;
    },
  });
};

export const useUpdateProfile = (): UseMutationResult<AuthUser, unknown, UpdateProfilePayload> => {
  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const response = await ERDEAxios.patch<AuthUser>('/user/me', payload);
      return response.data;
    },
  });
};

export const useUploadAvatar = (): UseMutationResult<AuthUser, unknown, FormData> => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await ERDEAxios.post<AuthUser>('/user/upload', formData);
      return response.data;
    },
  });
};

export const useChangePassword = (): UseMutationResult<ChangePasswordResponse, unknown, ChangePasswordPayload> => {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const response = await ERDEAxios.post<ChangePasswordResponse>('/user/change-password', payload);
      return response.data;
    },
  });
};
