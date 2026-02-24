import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { HospitalAdminDashboard } from './pages/HospitalAdminDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { PatientDashboard } from './pages/PatientDashboard';

function App() {
  const token = localStorage.getItem('token');
  const user = token ? JSON.parse(localStorage.getItem('user') || '{}') : null;

  const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({
    children,
    allowedRoles,
  }) => {
    if (!token) return <Navigate to="/" />;
    if (!allowedRoles.includes(user?.role)) return <Navigate to="/" />;
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']}>
              <HospitalAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
