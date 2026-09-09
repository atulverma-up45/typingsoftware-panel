import React from 'react';
import { useAuthStore } from '@/stores/auth.store';
import Tooltip from '@/components/ui/Tooltip';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT';

export const PERMISSIONS = {
  // Institutions
  INSTITUTION_READ: 'institution.read',
  INSTITUTION_WRITE: 'institution.write',
  INSTITUTION_DELETE: 'institution.delete',

  // Subscriptions & Plans
  PLAN_READ: 'plan.read',
  PLAN_WRITE: 'plan.write',
  SUBSCRIPTION_READ: 'subscription.read',
  SUBSCRIPTION_WRITE: 'subscription.write',

  // Licenses
  LICENSE_READ: 'license.read',
  LICENSE_CREATE: 'license.create',
  LICENSE_REVOKE: 'license.revoke',
  LICENSE_EXTEND: 'license.extend',

  // Activations
  ACTIVATION_READ: 'activation.read',
  ACTIVATION_REVOKE: 'activation.revoke',

  // Modules & Content
  MODULE_READ: 'module.read',
  MODULE_WRITE: 'module.write',
  CONTENT_READ: 'content.read',
  CONTENT_WRITE: 'content.write',

  // Releases
  RELEASE_READ: 'release.read',
  RELEASE_PUBLISH: 'release.publish',

  // Sync
  SYNC_READ: 'sync.read',
  SYNC_WRITE: 'sync.write',

  // Audit Logs
  AUDIT_READ: 'audit.read',

  // Dashboard
  DASHBOARD_READ: 'dashboard.read',

  // Users Management (API routes: SUPER_ADMIN, ADMIN)
  USER_READ: 'user.read',
  USER_WRITE: 'user.write',

  // Auth & Security Intelligence (API routes: SUPER_ADMIN only)
  AUTH_TRACKING_READ: 'auth_tracking.read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    PERMISSIONS.INSTITUTION_READ,
    PERMISSIONS.INSTITUTION_WRITE,
    PERMISSIONS.INSTITUTION_DELETE,
    PERMISSIONS.PLAN_READ,
    PERMISSIONS.PLAN_WRITE,
    PERMISSIONS.SUBSCRIPTION_READ,
    PERMISSIONS.SUBSCRIPTION_WRITE,
    PERMISSIONS.LICENSE_READ,
    PERMISSIONS.LICENSE_CREATE,
    PERMISSIONS.LICENSE_REVOKE,
    PERMISSIONS.LICENSE_EXTEND,
    PERMISSIONS.ACTIVATION_READ,
    PERMISSIONS.ACTIVATION_REVOKE,
    PERMISSIONS.MODULE_READ,
    PERMISSIONS.MODULE_WRITE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_WRITE,
    PERMISSIONS.RELEASE_READ,
    PERMISSIONS.RELEASE_PUBLISH,
    PERMISSIONS.SYNC_READ,
    PERMISSIONS.SYNC_WRITE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.AUTH_TRACKING_READ,
  ],
  ADMIN: [
    PERMISSIONS.INSTITUTION_READ,
    PERMISSIONS.INSTITUTION_WRITE,
    PERMISSIONS.PLAN_READ,
    PERMISSIONS.SUBSCRIPTION_READ,
    PERMISSIONS.LICENSE_READ,
    PERMISSIONS.LICENSE_CREATE,
    PERMISSIONS.ACTIVATION_READ,
    PERMISSIONS.ACTIVATION_REVOKE,
    PERMISSIONS.MODULE_READ,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.RELEASE_READ,
    PERMISSIONS.SYNC_READ,
    PERMISSIONS.SYNC_WRITE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
  ],
  SUPPORT: [
    PERMISSIONS.INSTITUTION_READ,
    PERMISSIONS.PLAN_READ,
    PERMISSIONS.SUBSCRIPTION_READ,
    PERMISSIONS.LICENSE_READ,
    PERMISSIONS.ACTIVATION_READ,
    PERMISSIONS.MODULE_READ,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.RELEASE_READ,
    PERMISSIONS.SYNC_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.DASHBOARD_READ,
  ],
};

/**
 * Check whether a role has a specific permission
 */
export function hasPermission(role: UserRole | string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const validRole = role.toUpperCase() as UserRole;
  const permissions = ROLE_PERMISSIONS[validRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Check whether a role matches any of the allowed roles
 */
export function hasAnyRole(userRole: string | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole.toUpperCase() as UserRole);
}

/**
 * Checks if a route path is accessible for a given role
 */
export function canAccessRoute(role: string | undefined, path: string): boolean {
  if (!role) return false;
  const upperRole = role.toUpperCase();

  // Super Admin can access all routes
  if (upperRole === 'SUPER_ADMIN') return true;

  // /auth-tracking is exclusively for SUPER_ADMIN
  if (path === '/auth-tracking' || path.startsWith('/auth-tracking/')) {
    return false;
  }

  // /plans is exclusively for SUPER_ADMIN
  if (path === '/plans' || path.startsWith('/plans/')) {
    return false;
  }

  // /users is only for SUPER_ADMIN and ADMIN (Librarians)
  if (path === '/users' || path.startsWith('/users/')) {
    return upperRole === 'ADMIN';
  }

  // Other routes are accessible (though actions within them may be restricted)
  return true;
}

/**
 * Reactive React hook for component-level RBAC checks
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const rawRole = user?.role || 'ADMIN';
  const role = rawRole.toUpperCase() as UserRole;

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN';
  const isSupport = role === 'SUPPORT';

  const can = (permission: Permission): boolean => {
    return hasPermission(role, permission);
  };

  const isRouteAllowed = (path: string): boolean => {
    return canAccessRoute(role, path);
  };

  const checkRoles = (allowedRoles: UserRole[]): boolean => {
    return hasAnyRole(role, allowedRoles);
  };

  // Senior UI/UX Anti-Trick Permission Flags:
  // Centralized authority rules so components never duplicate or guess logic
  const canMutateModules = isSuperAdmin;
  const canMutateContent = isSuperAdmin;
  const canMutateReleases = isSuperAdmin;
  const canMutatePlans = isSuperAdmin;
  const canPermanentDelete = isSuperAdmin;
  const canPruneLogs = isSuperAdmin;
  const canMutateSubscriptions = isSuperAdmin || isAdmin;
  const canMutateLicenses = isSuperAdmin || isAdmin;
  const canMutateWorkstations = isSuperAdmin || isAdmin;
  const canMutateInstitutions = isSuperAdmin || isAdmin;

  return {
    user,
    role,
    isSuperAdmin,
    isAdmin,
    isSupport,
    can,
    isRouteAllowed,
    hasAnyRole: checkRoles,
    // Direct capability flags
    canMutateModules,
    canMutateContent,
    canMutateReleases,
    canMutatePlans,
    canPermanentDelete,
    canPruneLogs,
    canMutateSubscriptions,
    canMutateLicenses,
    canMutateWorkstations,
    canMutateInstitutions,
  };
}

/**
 * Anti-Trick Action Wrapper:
 * When user lacks permission, it prevents clicks, renders disabled styles,
 * and displays an explanatory tooltip so the user is never tricked into
 * thinking they can perform an unauthorized mutation.
 */
interface ProtectedActionProps {
  permission?: Permission;
  allowed?: boolean;
  children: React.ReactElement<any>;
  tooltipMessage?: string;
  fallbackHidden?: boolean;
}

export const ProtectedAction: React.FC<ProtectedActionProps> = ({
  permission,
  allowed: explicitAllowed,
  children,
  tooltipMessage,
  fallbackHidden = false,
}) => {
  const { can, role } = usePermissions();
  const allowed = explicitAllowed !== undefined ? explicitAllowed : (permission ? can(permission) : false);

  if (allowed) {
    return children;
  }

  if (fallbackHidden) {
    return null;
  }

  const defaultMessage =
    role === 'SUPPORT'
      ? 'Support role has read-only access. Action disabled.'
      : 'Administrator privileges required for this action.';

  const message = tooltipMessage || defaultMessage;

  // Clone child with disabled state, inert pointer events, and muted opacity
  const clonedChild = React.cloneElement(children, {
    disabled: true,
    tabIndex: -1,
    'aria-disabled': true,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    className: `${children.props.className || ''} opacity-40 cursor-not-allowed pointer-events-none select-none grayscale-[30%]`,
    title: message,
  });

  return (
    <Tooltip content={message} position="top" className="inline-flex">
      <span className="inline-flex items-center relative cursor-not-allowed">
        {clonedChild}
      </span>
    </Tooltip>
  );
};

/**
 * Anti-Trick Dropdown Item:
 * Standardized disabled/locked item for context menus and action dropdowns
 * with honest lock icon and explanatory tooltip.
 */
interface LockedDropdownActionProps {
  label: string;
  tooltipMessage?: string;
  icon?: React.ReactNode;
}

export const LockedDropdownAction: React.FC<LockedDropdownActionProps> = ({
  label,
  tooltipMessage = 'Action restricted. You do not have permission to perform this mutation.',
  icon,
}) => {
  return (
    <div
      title={tooltipMessage}
      className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-gray-400 opacity-60 cursor-not-allowed select-none pointer-events-none bg-gray-50/60"
    >
      {icon ? (
        icon
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400 shrink-0"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
      <span className="truncate">{label} (Locked)</span>
    </div>
  );
};
