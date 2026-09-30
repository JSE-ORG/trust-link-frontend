import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { SESSION_EXPIRED_EVENT, handleSessionExpired } from '../auth/constants';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await api(config);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      handleSessionExpired();
    }
    throw error;
  }
}

export function setupInterceptors(): void {
  api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        handleSessionExpired();
      }
      return Promise.reject(error);
    }
  );
}