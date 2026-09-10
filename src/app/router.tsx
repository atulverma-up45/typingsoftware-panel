import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ProtectedRoute, RoleRoute } from '@/components/guards/ProtectedRoute';
import { getAccessibleRolesForPath } from '@/config/navigation';
import { PageLoader } from '@/components/ui/PageLoader';
import { NotFoundPage } from '@/components/errors/NotFoundPage';

// Pages — route-level code splitting: each feature page is its own chunk and
// only downloads when first visited. The layout and guards stay eager (they
// are tiny and needed on every screen).
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const AuthTrackingPage = lazy(() => import('@/features/auth-tracking/pages/AuthTrackingPage'));
const InstitutionsPage = lazy(() => import('@/features/institutions/pages/InstitutionsPage'));
const LicensesPage = lazy(() => import('@/features/licenses/pages/LicensesPage'));
const ActivationsPage = lazy(() => import('@/features/activations/pages/ActivationsPage'));
const PlansPage = lazy(() => import('@/features/plans/pages/PlansPage'));
const SubscriptionsPage = lazy(() => import('@/features/subscriptions/pages/SubscriptionsPage'));
const ModulesPage = lazy(() => import('@/features/modules/pages/ModulesPage'));
const ContentPage = lazy(() => import('@/features/content/pages/ContentPage'));
const ReleasesPage = lazy(() => import('@/features/releases/pages/ReleasesPage'));
const SyncPage = lazy(() => import('@/features/sync/pages/SyncPage'));
const AuditPage = lazy(() => import('@/features/audit/pages/AuditPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));

/**
 * Every page route is wrapped in a RoleRoute whose allowed roles come from
 * the navigation registry (config/navigation.ts) — the single source of
 * truth for route access. Fail-closed: a path missing from the registry
 * denies everyone, so a typo can never silently expose a page.
 */
const guardedRoute = (path: string, page: React.ReactNode) => (
  <Route element={<RoleRoute allowedRoles={getAccessibleRolesForPath(path)} />}>
    <Route path={path} element={page} />
  </Route>
);

export const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Overview */}
            {guardedRoute('/dashboard', <DashboardPage />)}

            {/* Identity & Access */}
            {guardedRoute('/users', <UsersPage />)}
            {guardedRoute('/auth-tracking', <AuthTrackingPage />)}

            {/* Tenancy & Licensing */}
            {guardedRoute('/institutions', <InstitutionsPage />)}
            <Route path="/branding" element={<Navigate to="/institutions" replace />} />
            {guardedRoute('/licenses', <LicensesPage />)}
            {guardedRoute('/activations', <ActivationsPage />)}

            {/* Learning & Content */}
            {guardedRoute('/content', <ContentPage />)}
            {guardedRoute('/modules', <ModulesPage />)}

            {/* Workstation Telemetry */}
            {guardedRoute('/sync', <SyncPage />)}

            {/* Software Releases & Distribution */}
            {guardedRoute('/releases', <ReleasesPage />)}
            <Route path="/uploads" element={<Navigate to="/releases" replace />} />

            {/* Commercial */}
            {guardedRoute('/subscriptions', <SubscriptionsPage />)}
            {guardedRoute('/plans', <PlansPage />)}

            {/* System */}
            {guardedRoute('/audit', <AuditPage />)}
            {guardedRoute('/settings', <SettingsPage />)}

            {/* Unknown URLs get an honest 404 inside the app shell (no silent redirect) */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};


