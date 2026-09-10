import { describe, expect, it } from 'vitest';
import {
  getAccessibleRolesForPath,
  getMobileDockForRole,
  getNavSectionsForRole,
  NAV_ROUTES,
} from '@/config/navigation';

/**
 * Navigation-registry guards.
 *
 * `config/navigation.ts` is the single source of truth for:
 *   - which roles may OPEN each route (mirrors API `requireRole`)
 *   - sidebar labels/sections per role
 *   - mobile dock membership per role
 *
 * If these tests break, you changed navigation on purpose — but you must also
 * update Sidebar/DashboardLayout/router and the API's route roles.
 */

const SUPER_ADMIN_SIDEBAR = [
  { title: 'OVERVIEW', items: ['Dashboard'] },
  { title: 'IDENTITY & ACCESS', items: ['Users', 'Auth & Devices'] },
  { title: 'TENANCY & LICENSING', items: ['Institutions', 'Licenses', 'Activations'] },
  { title: 'LEARNING & CONTENT', items: ['Modules', 'Content', 'Releases'] },
  {
    title: 'COMMERCIAL & SYSTEM',
    items: ['Subscriptions', 'Plans', 'Sync Logs', 'Audit', 'Settings'],
  },
];

// NOTE: item order WITHIN a section is canonical across all roles. The ADMIN
// orderings below differ from the pre-refactor hand-written sidebar on
// purpose: "Typing Modules" now precedes "Typing Passages" and "Licenses"
// precedes "Workstations" — the same relative order SUPER_ADMIN/SUPPORT see.
const ADMIN_SIDEBAR = [
  { title: 'OVERVIEW', items: ['Dashboard'] },
  { title: 'CLASSROOM & STUDENTS', items: ['Students & Staff', 'Typing Modules', 'Typing Passages'] },
  { title: 'LAB & WORKSTATIONS', items: ['Licenses', 'Workstations'] },
  {
    title: 'INSTITUTION & LOGS',
    items: ['My Institution', 'Subscriptions', 'Sync Logs', 'Audit Logs', 'Settings'],
  },
];

const SUPPORT_SIDEBAR = [
  { title: 'OVERVIEW', items: ['Dashboard'] },
  { title: 'TENANCY & HARDWARE', items: ['Institutions', 'Licenses', 'Workstations'] },
  {
    title: 'CURRICULUM & SOFTWARE',
    items: ['Typing Modules', 'Typing Passages', 'Releases'],
  },
  {
    title: 'DIAGNOSTICS & AUDIT',
    items: ['Subscriptions', 'Sync Logs', 'Audit Logs', 'Settings'],
  },
];

describe('navigation registry', () => {
  it('defines every canonical route', () => {
    expect(NAV_ROUTES.map((r) => r.path)).toEqual([
      '/dashboard',
      '/users',
      '/auth-tracking',
      '/institutions',
      '/licenses',
      '/activations',
      '/modules',
      '/content',
      '/releases',
      '/subscriptions',
      '/plans',
      '/sync',
      '/audit',
      '/settings',
    ]);
  });

  it('rebuilds the canonical SUPER_ADMIN sidebar snapshot', () => {
    const sections = getNavSectionsForRole('SUPER_ADMIN').map((s) => ({
      title: s.title,
      items: s.items.map((i) => i.name),
    }));
    expect(sections).toEqual(SUPER_ADMIN_SIDEBAR);
  });

  it('rebuilds the canonical ADMIN sidebar snapshot', () => {
    const sections = getNavSectionsForRole('ADMIN').map((s) => ({
      title: s.title,
      items: s.items.map((i) => i.name),
    }));
    expect(sections).toEqual(ADMIN_SIDEBAR);
  });

  it('rebuilds the canonical SUPPORT sidebar snapshot', () => {
    const sections = getNavSectionsForRole('SUPPORT').map((s) => ({
      title: s.title,
      items: s.items.map((i) => i.name),
    }));
    expect(sections).toEqual(SUPPORT_SIDEBAR);
  });

  it('rebuilds the mobile dock exactly as before the refactor', () => {
    expect(getMobileDockForRole('SUPER_ADMIN').map((i) => i.name)).toEqual([
      'Dashboard',
      'Users',
      'Tenants',
      'Workstations',
    ]);
    expect(getMobileDockForRole('ADMIN').map((i) => i.name)).toEqual([
      'Dashboard',
      'Students',
      'Workstations',
      'Passages',
    ]);
    expect(getMobileDockForRole('SUPPORT').map((i) => i.name)).toEqual([
      'Dashboard',
      'Tenants',
      'Licenses',
      'Devices',
    ]);
  });

  it('keeps route access in lockstep with the API role restrictions', () => {
    expect(getAccessibleRolesForPath('/users')).toEqual(['SUPER_ADMIN', 'ADMIN']);
    expect(getAccessibleRolesForPath('/auth-tracking')).toEqual(['SUPER_ADMIN']);
    expect(getAccessibleRolesForPath('/plans')).toEqual(['SUPER_ADMIN']);
    expect(getAccessibleRolesForPath('/releases')).toEqual([
      'SUPER_ADMIN',
      'ADMIN',
      'SUPPORT',
    ]);
  });

  it('is fail-closed for unknown paths and unknown roles', () => {
    expect(getAccessibleRolesForPath('/does-not-exist')).toEqual([]);
    expect(getNavSectionsForRole('HACKER' as 'SUPER_ADMIN')).toEqual([]);
    expect(getMobileDockForRole('HACKER' as 'SUPER_ADMIN')).toEqual([]);
  });
});