import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useWallet, WalletState } from '../../hooks/useWallet';
import { SESSION_KEY } from '../../lib/auth/constants';

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }): JSX.Element {
  const wallet = useWallet();
  const value = useMemo(() => wallet, [wallet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext(): WalletState {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWalletContext must be used within WalletProvider');
  return context;
}

export function setWalletSession(session: WalletState): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearWalletSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}
