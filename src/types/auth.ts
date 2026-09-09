/**
 * Single source of truth for authorization identity types.
 * Imported by `lib/permissions` and every feature API module — never re-declare.
 */

export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];