import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HospitalAdminDashboard from './pages/HospitalAdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import { ThemeProvider, useTheme } from './theme';
import API from './api';

/* ── JWT helpers (no library needed) ── */
function decodeJWT(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch { return null; }
}

function isTokenExpired(token: string): boolean {
  const p = decodeJWT(token);
  if (!p?.exp) return true;
  return Date.now() >= p.exp * 1000;
}

/* ── Auth-aware dashboard wrapper ── */
function DashboardWrapper({ Component, allowedRoles, user, onLogout }: {
  Component: React.FC<{ user: any; onLogout: () => void }>;
  allowedRoles: string[];
  user: any;
  onLogout: () => void;
}) {
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return <Component user={user} onLogout={onLogout} />;
}

/* ── Loading spinner ── */
function LoadingScreen() {
  const { isDark } = useTheme();
  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors ${isDark ? 'bg-[#0b0f1a]' : 'bg-gradient-to-b from-slate-50 to-gray-100'}`}>
      <div className="text-center animate-fade-in">
        <div className="w-12 h-12 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className={`text-sm mt-4 font-medium ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  /* ── Restore session on mount ── */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      // 1. No token → not logged in
      if (!token) { setLoading(false); return; }

      // 2. Token expired → clean up locally (no backend call needed)
      if (isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      // 3. Try instant restore from cached user
      const cached = localStorage.getItem('user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.id && parsed?.role) {
            setUser(parsed);
            setLoading(false);

            // Background refresh — silently update, never log out on failure
            try {
              const res = await API.get('/auth/me');
              if (res.data.user) {
                setUser(res.data.user);
                localStorage.setItem('user', JSON.stringify(res.data.user));
              }
            } catch {
              // Backend cold-starting or network hiccup — keep cached user
            }
            return;
          }
        } catch { /* corrupted cache — fall through */ }
      }

      // 4. No cache — must verify with backend (with retries for cold starts)
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await API.get('/auth/me');
          if (res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
          setLoading(false);
          return;
        } catch (err: any) {
          // 401/403 = token truly invalid → stop retrying
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setLoading(false);
            return;
          }
          // Network / 500 → wait and retry
          if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
        }
      }

      // 5. All retries failed but token is valid — decode JWT as fallback
      const payload = decodeJWT(token);
      if (payload?.id && payload?.role) {
        const fallbackUser = { id: payload.id, name: payload.name || 'User', phone: payload.phone || '', role: payload.role };
        setUser(fallbackUser);
        localStorage.setItem('user', JSON.stringify(fallbackUser));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = useCallback((u: any) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to={
          user.role === 'SUPER_ADMIN' ? '/super-admin' :
          user.role === 'HOSPITAL_ADMIN' ? '/admin' :
          user.role === 'DOCTOR' ? '/doctor' : '/patient'
        } /> : <LoginPage />} />
        <Route path="/super-admin" element={<DashboardWrapper Component={SuperAdminDashboard} allowedRoles={['SUPER_ADMIN']} user={user} onLogout={handleLogout} />} />
        <Route path="/admin" element={<DashboardWrapper Component={HospitalAdminDashboard} allowedRoles={['HOSPITAL_ADMIN']} user={user} onLogout={handleLogout} />} />
        <Route path="/doctor" element={<DashboardWrapper Component={DoctorDashboard} allowedRoles={['DOCTOR']} user={user} onLogout={handleLogout} />} />
        <Route path="/patient" element={<DashboardWrapper Component={PatientDashboard} allowedRoles={['PATIENT']} user={user} onLogout={handleLogout} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}
