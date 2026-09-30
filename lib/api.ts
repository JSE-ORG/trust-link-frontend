import { apiRequest } from './api/client';
import { SESSION_KEY } from './auth/constants';

export async function fetchProtectedData() {
  return apiRequest({ url: '/protected', method: 'GET' });
}

export function clearAuth(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}