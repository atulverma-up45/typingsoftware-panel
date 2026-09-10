import {
  BarChart2,
  BrainCircuit,
  Clock,
  DollarSign,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Package,
  Radio,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { USER_ROLES, type UserRole } from '@/types/auth';

/**
 * Single source of truth for every admin-panel route and its access policy.
 *
 * Consumers (all derive from this registry — adding a page is a one-entry
 * change here):
 *   - app/router.tsx                         → route table + RoleRoute guards
 *   - components/layout/Sidebar.tsx          → role-filtered nav sections
 *   - components/layout/DashboardLayout.tsx  → mobile bottom-dock quick nav
 *   - lib/permissions                        → canAccessRoute()
 *
 * Two distinct role concepts live here:
 *   - `roles`            → who may OPEN the route (enforced by RoleRoute;
 *                          mirrors the API's `requireRole` middleware, e.g.
 *                          /plans and /auth-tracking are SUPER_ADMIN-only).
 *   - presentation tweaks (`dock`, `labels`, `sections`,
 *     `sidebarHiddenFor`) → never widen access; they only adapt wording and
 *     layout per role. E.g. ADMIN can open /releases but gets no sidebar link.
 */
export interface NavRoute {
  path: string;
  /** Canonical sidebar label. */
  label: string;
  /** Role-adapted label overrides (e.g. "Students & Staff" for librarians). */
  labels?: Partial<Record<UserRole, string>>;
  icon: LucideIcon;
  /** Roles allowed to open the route. Fail-closed: empty = no one. */
  roles: UserRole[];
  /** Sidebar section heading (shared across roles unless overridden). */
  section: string;
  /** Per-role section heading overrides. */
  sections?: Partial<Record<UserRole, string>>;
  /** Mobile bottom-dock membership per role (value = dock label). */
  dock?: Partial<Record<UserRole, string>>;
  /** Roles that may open the route but get no sidebar link. */
  sidebarHiddenFor?: UserRole[];
}

const ALL_ROLES: UserRole[] = [...USER_ROLES];

/**
 * IMPORTANT: array order defines sidebar section order (sections are grouped
 * by first appearance) and dock order — do not reorder casually.
 */
export const NAV_ROUTES: NavRoute[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
    section: 'OVERVIEW',
    dock: { SUPER_ADMIN: 'Dashboard', ADMIN: 'Dashboard', SUPPORT: 'Dashboard' },
  },

  {
    path: '/users',
    label: 'Users',
    labels: { ADMIN: 'Students & Staff' },
    icon: Users,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    section: 'IDENTITY & ACCESS',
    sections: { ADMIN: 'CLASSROOM & STUDENTS' },
    dock: { SUPER_ADMIN: 'Users', ADMIN: 'Students' },
  },
  {
    path: '/auth-tracking',
    label: 'Auth & Devices',
    icon: Radio,
    roles: ['SUPER_ADMIN'],
    section: 'IDENTITY & ACCESS',
  },
  {
    path: '/institutions',
    label: 'Institutions',
    labels: { ADMIN: 'My Institution' },
    icon: GraduationCap,
    roles: ALL_ROLES,
    section: 'TENANCY & LICENSING',
    sections: { ADMIN: 'INSTITUTION & LOGS', SUPPORT: 'TENANCY & HARDWARE' },
    dock: { SUPER_ADMIN: 'Tenants', SUPPORT: 'Tenants' },
  },

  {
    path: '/licenses',
    label: 'Licenses',
    icon: Shield,
    roles: ALL_ROLES,
    section: 'TENANCY & LICENSING',
    sections: { ADMIN: 'LAB & WORKSTATIONS', SUPPORT: 'TENANCY & HARDWARE' },
    dock: { SUPPORT: 'Licenses' },
  },
  {
    path: '/activations',
    label: 'Activations',
    labels: { ADMIN: 'Workstations', SUPPORT: 'Workstations' },
    icon: BrainCircuit,
    roles: ALL_ROLES,
    section: 'TENANCY & LICENSING',
    sections: { ADMIN: 'LAB & WORKSTATIONS', SUPPORT: 'TENANCY & HARDWARE' },
    dock: { SUPER_ADMIN: 'Workstations', ADMIN: 'Workstations', SUPPORT: 'Devices' },
  },
  {
    path: '/modules',
    label: 'Modules',
    labels: { ADMIN: 'Typing Modules', SUPPORT: 'Typing Modules' },
    icon: Layers,
    roles: ALL_ROLES,
    section: 'LEARNING & CONTENT',
    sections: { ADMIN: 'CLASSROOM & STUDENTS', SUPPORT: 'CURRICULUM & SOFTWARE' },
  },
  {
    path: '/content',
    label: 'Content',
    labels: { ADMIN: 'Typing Passages', SUPPORT: 'Typing Passages' },
    icon: FileText,
    roles: ALL_ROLES,
    section: 'LEARNING & CONTENT',
    sections: { ADMIN: 'CLASSROOM & STUDENTS', SUPPORT: 'CURRICULUM & SOFTWARE' },
    dock: { ADMIN: 'Passages' },
  },

  {
    path: '/releases',
    label: 'Releases',
    icon: Package,
    roles: ALL_ROLES,
    section: 'LEARNING & CONTENT',
    sections: { SUPPORT: 'CURRICULUM & SOFTWARE' },
    // ADMIN may open /releases (API allows it) but the sidebar omits it —
    // release management is a platform-operator task, not a librarian task.
    sidebarHiddenFor: ['ADMIN'],
  },
  {
    path: '/subscriptions',
    label: 'Subscriptions',
    icon: DollarSign,
    roles: ALL_ROLES,
    section: 'COMMERCIAL & SYSTEM',
    sections: { ADMIN: 'INSTITUTION & LOGS', SUPPORT: 'DIAGNOSTICS & AUDIT' },
  },
  {
    path: '/plans',
    label: 'Plans',
    icon: BarChart2,
    roles: ['SUPER_ADMIN'],
    section: 'COMMERCIAL & SYSTEM',
  },
  {
    path: '/sync',
    label: 'Sync Logs',
    icon: Clock,
    roles: ALL_ROLES,
    section: 'COMMERCIAL & SYSTEM',
    sections: { ADMIN: 'INSTITUTION & LOGS', SUPPORT: 'DIAGNOSTICS & AUDIT' },
  },
  {
    path: '/audit',
    label: 'Audit',
    labels: { ADMIN: 'Audit Logs', SUPPORT: 'Audit Logs' },
    icon: MessageSquare,
    roles: ALL_ROLES,
    section: 'COMMERCIAL & SYSTEM',
    sections: { ADMIN: 'INSTITUTION & LOGS', SUPPORT: 'DIAGNOSTICS & AUDIT' },
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    roles: ALL_ROLES,
    section: 'COMMERCIAL & SYSTEM',
    sections: { ADMIN: 'INSTITUTION & LOGS', SUPPORT: 'DIAGNOSTICS & AUDIT' },
  },
];

/** Route lookup by exact path. */
export const getNavRoute = (path: string): NavRoute | undefined =>
  NAV_ROUTES.find((route) => route.path === path);

/**
 * Roles that may OPEN a path. Fail-closed: unknown paths / empty roles
 * return an empty list, so callers never grant access accidentally.
 */
export const getAccessibleRolesForPath = (path: string): UserRole[] =>
  getNavRoute(path)?.roles ?? [];

export interface NavSectionView {
  title: string;
  items: { name: string; path: string; icon: LucideIcon }[];
}

/**
 * Sidebar sections for a role — registry order preserved, items grouped by
 * their section's first appearance. Fail-closed: unknown roles get no nav.
 */
export function getNavSectionsForRole(role: UserRole): NavSectionView[] {
  // Section grouping, titles, and SECTION order are genuinely role-specific
  // (real IA differences: ADMIN gets "LAB & WORKSTATIONS", SUPER_ADMIN gets
  // "TENANCY & LICENSING"), so each role declares its section order here.
  // Item order WITHIN a section is the canonical registry order for every
  // role: the legacy hand-written arrays had accidental intra-section drift
  // for ADMIN (Typing Modules before Passages, Licenses before Workstations)
  // that was normalized during the registry refactor.
  const SIDEBAR_SECTION_ORDER: Record<UserRole, string[]> = {
    SUPER_ADMIN: [
      'OVERVIEW',
      'IDENTITY & ACCESS',
      'TENANCY & LICENSING',
      'LEARNING & CONTENT',
      'COMMERCIAL & SYSTEM',
    ],
    ADMIN: ['OVERVIEW', 'CLASSROOM & STUDENTS', 'LAB & WORKSTATIONS', 'INSTITUTION & LOGS'],
    SUPPORT: [
      'OVERVIEW',
      'TENANCY & HARDWARE',
      'CURRICULUM & SOFTWARE',
      'DIAGNOSTICS & AUDIT',
    ],
  };
  const order = SIDEBAR_SECTION_ORDER[role];
  // Fail-closed: unknown roles get no navigation at all.
  if (!order) return[];

  const sectionMap = new Map<string, NavSectionView>();
  for (const route of NAV_ROUTES) {
    if (!route.roles.includes(role)) continue;
    if (route.sidebarHiddenFor?.includes(role)) continue;
    const title = route.sections?.[role] ?? route.section;
    if (!order.includes(title)) continue; // unknown section => skip (config error)
    if (!sectionMap.has(title)) sectionMap.set(title, { title, items: [] });
    sectionMap.get(title)!.items.push({ name: route.labels?.[role] ?? route.label, path: route.path, icon: route.icon });
  }

  return order.filter((title) => sectionMap.has(title)).map((title) => sectionMap.get(title)!);
}

export interface MobileDockItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

/** Mobile bottom-dock entries for a role, in registry order. */
export function getMobileDockForRole(role: UserRole): MobileDockItem[] {
  return NAV_ROUTES.filter(
    (route) => route.dock?.[role] !== undefined && route.roles.includes(role),
  ).map((route) => ({
    name: route.dock?.[role] as string,
    path: route.path,
    icon: route.icon,
  }));
}
