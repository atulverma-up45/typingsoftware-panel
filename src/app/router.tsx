import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/layouts/ProtectedRoute';

// Pages
import LoginPage from '@/features/auth/pages/LoginPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import UsersPage from '@/features/users/pages/UsersPage';
import AuthTrackingPage from '@/features/auth-tracking/pages/AuthTrackingPage';
import InstitutionsPage from '@/features/institutions/pages/InstitutionsPage';
import LicensesPage from '@/features/licenses/pages/LicensesPage';
import ActivationsPage from '@/features/activations/pages/ActivationsPage';
import PlansPage from '@/features/plans/pages/PlansPage';
import SubscriptionsPage from '@/features/subscriptions/pages/SubscriptionsPage';
import ModulesPage from '@/features/modules/pages/ModulesPage';
import ContentPage from '@/features/content/pages/ContentPage';
import ReleasesPage from '@/features/releases/pages/ReleasesPage';
import SyncPage from '@/features/sync/pages/SyncPage';
import AuditPage from '@/features/audit/pages/AuditPage';
import SettingsPage from '@/features/settings/pages/SettingsPage';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/auth-tracking" element={<AuthTrackingPage />} />
          {/* Institutions Module */}
          <Route path="/institutions" element={<InstitutionsPage />} />
          <Route path="/branding" element={<Navigate to="/institutions" replace />} />
          {/* Licenses Module */}
          <Route path="/licenses" element={<LicensesPage />} />
          {/* Activations Module */}
          <Route path="/activations" element={<ActivationsPage />} />
          {/* Typing Modules & Content */}
          <Route path="/content" element={<ContentPage />} />
          <Route path="/modules" element={<ModulesPage />} />
          {/* Workstation Synchronization & Telemetry */}
          <Route path="/sync" element={<SyncPage />} />
          {/* Software Releases & Distribution */}
          <Route path="/releases" element={<ReleasesPage />} />
          <Route path="/uploads" element={<Navigate to="/releases" replace />} />
          {/* Commercial Subscriptions & Plans Modules */}
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/plans" element={<PlansPage />} />
          {/* System Audit Trail & Forensics */}
          <Route path="/audit" element={<AuditPage />} />
          {/* System Settings & Diagnostics */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};
