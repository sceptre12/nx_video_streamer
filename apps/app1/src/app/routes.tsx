import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/require-auth';
import { SessionProvider } from './components/session';
import LibraryPage from './pages/library';
import LoginPage from './pages/login';
import WebcamPage from './pages/webcam';

export function AppRoutes() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><LibraryPage /></RequireAuth>} />
        <Route path="/webcam" element={<RequireAuth><WebcamPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionProvider>
  );
}

export default AppRoutes;
