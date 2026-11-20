import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from './session';

/** Redirects a logged-out visit to the login page. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const location = useLocation();
  if (status === 'loading') return <p>Loading...</p>;
  if (status === 'out') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
