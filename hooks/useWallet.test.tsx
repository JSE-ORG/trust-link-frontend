import { renderHook, act } from '@testing-library/react';
import { useWallet, WalletState } from './useWallet';
import { SESSION_KEY, SESSION_EXPIRED_EVENT, handleSessionExpired } from '../lib/auth/constants';

describe('useWallet', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('returns default state when no session exists', () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current).toEqual({ address: null, connected: false });
  });

  it('reads session from storage', () => {
    const session: WalletState = { address: '0x123', connected: true };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    const { result } = renderHook(() => useWallet());
    expect(result.current).toEqual(session);
  });

  it('clears all storage keys on 401', () => {
    const session: WalletState = { address: '0x123', connected: true };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    act(() => {
      handleSessionExpired();
    });

    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('dispatches session expired event', () => {
    const mockFn = jest.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, mockFn);

    act(() => {
      handleSessionExpired();
    });

    expect(mockFn).toHaveBeenCalled();
    window.removeEventListener(SESSION_EXPIRED_EVENT, mockFn);
  });
});
