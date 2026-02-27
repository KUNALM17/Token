import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HospitalAdminDashboard from './pages/HospitalAdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import { ThemeProvider } from './theme';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = token ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  if (!token) return <Navigate to="/" />;
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/" />;
  return <>{children}</>;
};

function DashboardWrapper({ Component, allowedRoles }: { Component: React.FC<{ user: any; onLogout: () => void }>; allowedRoles: string[] }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = token ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  if (!token || !allowedRoles.includes(user?.role)) return <Navigate to="/" />;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return <Component user={user} onLogout={handleLogout} />;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/super-admin" element={<DashboardWrapper Component={SuperAdminDashboard} allowedRoles={['SUPER_ADMIN']} />} />
        <Route path="/admin" element={<DashboardWrapper Component={HospitalAdminDashboard} allowedRoles={['HOSPITAL_ADMIN']} />} />
        <Route path="/doctor" element={<DashboardWrapper Component={DoctorDashboard} allowedRoles={['DOCTOR']} />} />
        <Route path="/patient" element={<DashboardWrapper Component={PatientDashboard} allowedRoles={['PATIENT']} />} />
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
