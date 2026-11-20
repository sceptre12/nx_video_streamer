import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { ApiError, AuthUser, getMe, logout as apiLogout } from '../api';

export type SessionStatus = 'loading' | 'in' | 'out';

interface SessionValue {
  status: SessionStatus;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logoutError: string | null;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const setUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
    setStatus(next ? 'in' : 'out');
  }, []);

  useEffect(() => {
    let active = true;
    getMe().then(({ data }) => {
      if (active) setUser(data ?? null);
    });
    return () => {
      active = false;
    };
  }, [setUser]);

  const logout = useCallback(async () => {
    setLogoutError(null);
    const { error } = await apiLogout();
    // 401 means the session is already gone, which is what logout wants.
    if (error && !(error instanceof ApiError && error.status === 401)) {
      setLogoutError(error.message || 'Log out failed');
      return;
    }
    setUser(null);
  }, [setUser]);

  return (
    <SessionContext.Provider value={{ status, user, setUser, logoutError, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
