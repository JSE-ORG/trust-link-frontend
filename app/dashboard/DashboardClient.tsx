import { useEffect } from 'react';
import { SESSION_EXPIRED_EVENT, handleSessionExpired } from '../../lib/auth/constants';

export function DashboardClient() {
  useEffect(() => {
    const handleUnauthorized = () => handleSessionExpired();
    window.addEventListener(SESSION_EXPIRED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleUnauthorized);
  }, []);

  return <div>Dashboard Content</div>;
}