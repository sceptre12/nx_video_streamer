import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AuthUser, getMe, logout as apiLogout } from '../api';

export type SessionStatus = 'loading' | 'in' | 'out';

interface SessionValue {
  status: SessionStatus;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUserState] = useState<AuthUser | null>(null);

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
    await apiLogout();
    setUser(null);
  }, [setUser]);

  return (
    <SessionContext.Provider value={{ status, user, setUser, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
