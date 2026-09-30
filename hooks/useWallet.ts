import { useCallback, useEffect } from 'react';
import { SESSION_KEY, SESSION_EXPIRED_EVENT, handleSessionExpired } from '../lib/auth/constants';

export interface WalletState {
  address: string | null;
  connected: boolean;
}

export function useWallet(): WalletState {
  const getSession = useCallback((): WalletState => {
    try {
      const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : { address: null, connected: false };
    } catch {
      return { address: null, connected: false };
    }
  }, []);

  const clearSession = useCallback((): void => {
    handleSessionExpired();
  }, []);

  useEffect(() => {
    const handleExpired = () => clearSession();
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [clearSession]);

  return getSession();
}