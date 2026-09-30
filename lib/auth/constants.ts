export const SESSION_KEY = 'wallet.session';
export const SESSION_EXPIRED_EVENT = 'app:session_expired';

export function handleSessionExpired(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  const event = new CustomEvent(SESSION_EXPIRED_EVENT);
  window.dispatchEvent(event);
  window.location.href = '/';
}