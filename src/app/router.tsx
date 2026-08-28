import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/layouts/ProtectedRoute';

// Pages
import LoginPage from '@/features/auth/pages/LoginPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Skeleton routes for new typing software features */}
          <Route path="/institutions" element={<div className="p-8">Institutions Module (Coming Soon)</div>} />
          <Route path="/licenses" element={<div className="p-8">Licenses Module (Coming Soon)</div>} />
          <Route path="/activations" element={<div className="p-8">Activations Module (Coming Soon)</div>} />
          <Route path="/content" element={<div className="p-8">Content Module (Coming Soon)</div>} />
          <Route path="/modules" element={<div className="p-8">Typing Modules (Coming Soon)</div>} />
          <Route path="/sync" element={<div className="p-8">Sync Logs Module (Coming Soon)</div>} />
          <Route path="/releases" element={<div className="p-8">Releases Module (Coming Soon)</div>} />
          <Route path="/subscriptions" element={<div className="p-8">Subscriptions Module (Coming Soon)</div>} />
          <Route path="/plans" element={<div className="p-8">Plans Module (Coming Soon)</div>} />
          <Route path="/branding" element={<div className="p-8">Branding Module (Coming Soon)</div>} />
          <Route path="/audit" element={<div className="p-8">Audit Module (Coming Soon)</div>} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};
