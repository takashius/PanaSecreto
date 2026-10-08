import axios from 'axios';
import { message } from 'antd';
import urlJoin from 'url-join';
import {
  clearLocalSession,
  getApiErrorBody,
  getApiUserMessage,
  getErrorCode,
  isPublicAuthRequestUrl,
  type ApiErrorReject,
} from '@utils/apiAuthError';

const DEBUG = import.meta.env.VITE_API_DEBUG === 'true';
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const ERDEAxios = axios.create();

const DEFAULT_RATE_LIMIT_MSG = 'Demasiados intentos. Por favor, intenta más tarde.';

const rejectApiError = (payload: ApiErrorReject): Promise<never> => Promise.reject(payload);

const redirectToLogin = (): void => {
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
};

// Interceptor de peticiones salientes
ERDEAxios.interceptors.request.use(
  (config) => {
    const userToken = localStorage.getItem('Token');

    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }

    config.headers['Accept-Language'] = localStorage.getItem('preferred-language') || 'es';

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    if (config.url && !config.url.startsWith('http')) {
      config.url = urlJoin(apiUrl, config.url);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas entrantes
ERDEAxios.interceptors.response.use(
  (response) => {
    if (response?.status === 200 || response?.status === 201) {
      return Promise.resolve(response);
    }
    return Promise.reject(response);
  },
  (error) => {
    if (!error?.response?.status) {
      return Promise.reject(error);
    }

    const status: number = error.response.status;
    const responseData = error.response.data;
    const body = getApiErrorBody(responseData);
    const code = getErrorCode(body);
    const userMessage = getApiUserMessage(body ?? responseData, 'Ocurrió un error inesperado');
    const requestUrl = error.config?.url as string | undefined;

    // Sesión expirada o revocada
    if (status === 401) {
      if (!isPublicAuthRequestUrl(requestUrl)) {
        clearLocalSession();
        redirectToLogin();
      }
      return rejectApiError({ status, data: responseData, code });
    }

    // Permisos insuficientes
    if (status === 403) {
      message.error(userMessage);
      return rejectApiError({
        status,
        data: responseData,
        code,
        toastShown: true,
      });
    }

    // Rate Limiting
    if (status === 429) {
      const rateMessage =
        code === 'RATE_LIMITED'
          ? getApiUserMessage(body, DEFAULT_RATE_LIMIT_MSG)
          : (body?.message ?? DEFAULT_RATE_LIMIT_MSG);
      message.warning(rateMessage);
      return rejectApiError({
        status,
        data: responseData,
        code: code ?? 'RATE_LIMITED',
        toastShown: true,
        rateLimited: true,
      });
    }

    return rejectApiError({
      status,
      data: responseData,
      code,
    });
  }
);

export default ERDEAxios;
