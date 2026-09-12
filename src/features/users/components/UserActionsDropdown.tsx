import React, { useState } from 'react';
import {
  Edit,
  Trash2,
  Shield,
  KeyRound,
  Eye,
  RotateCcw,
  Trash,
  MailCheck,
  ShieldAlert,
} from 'lucide-react';
import type { User } from '../api/userApi';
import {
  useSoftDeleteUser,
  usePermanentDeleteUser,
  useRestoreUser,
  useUpdateUserRole,
  useSendResetPasswordEmail,
} from '../api/userApi';
import { useAuthStore } from '@/stores/auth.store';
import { usePermissions } from '@/lib/permissions';
import { ConfirmDialog } from '@/components/ui/Modal';
import { DropdownMenu, type DropdownMenuEntry } from '@/components/ui/DropdownMenu';

interface UserActionsDropdownProps {
  user: User;
  onEdit?: (user: User) => void;
  onResetPassword?: (user: User) => void;
  onViewDetails?: (user: User) => void;
  onChangeStatus?: (user: User) => void;
}

export const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({
  user,
  onEdit,
  onResetPassword,
  onViewDetails,
  onChangeStatus,
}) => {
  // Dialog triggers
  const [isConfirmingSoftDelete, setIsConfirmingSoftDelete] = useState(false);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [isConfirmingPermanentDelete, setIsConfirmingPermanentDelete] = useState(false);
  const [isConfirmingSendResetEmail, setIsConfirmingSendResetEmail] = useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const isSelf = currentUser?.id === user.id;
  // Canonical RBAC source — never derive role gates from the store directly
  const { isSuperAdmin } = usePermissions();

  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateUserRole();
  const { mutate: softDelete, isPending: isSoftDeleting } = useSoftDeleteUser();
  const { mutate: restore, isPending: isRestoring } = useRestoreUser();
  const { mutate: permanentDelete, isPending: isPermDeleting } = usePermanentDeleteUser();
  const { mutate: sendResetEmail, isPending: isSendingEmail } = useSendResetPasswordEmail();

  const isPending =
    isUpdatingRole || isSoftDeleting || isRestoring || isPermDeleting || isSendingEmail;

  const isDeleted = user.deletedAt !== null;

  const entries: DropdownMenuEntry[] = [
    {
      id: 'view',
      label: 'View Details & Sessions',
      icon: <Eye size={15} />,
      tone: 'info',
      onSelect: () => onViewDetails?.(user),
    },
  ];

  if (isDeleted) {
    // Deleted Account Actions (Super Admin only)
    if (isSuperAdmin) {
      entries.push(
        {
          id: 'restore',
          label: 'Restore Account',
          icon: <RotateCcw size={15} />,
          tone: 'info',
          onSelect: () => setIsConfirmingRestore(true),
        },
        { separator: true },
        {
          id: 'purge',
          label: 'Permanently Delete',
          icon: <Trash size={15} />,
          tone: 'critical',
          onSelect: () => setIsConfirmingPermanentDelete(true),
        },
      );
    }
  } else {
    entries.push(
      {
        id: 'edit',
        label: 'Edit Profile Details',
        icon: <Edit size={15} />,
        tone: 'blue',
        onSelect: () => onEdit?.(user),
      },
      {
        id: 'status',
        label: 'Change Account Status',
        icon: <ShieldAlert size={15} />,
        tone: 'warning',
        onSelect: () => onChangeStatus?.(user),
      },
      {
        id: 'reset-password',
        label: 'Reset Password',
        icon: <KeyRound size={15} />,
        tone: 'warning',
        onSelect: () => onResetPassword?.(user),
      },
      {
        id: 'send-reset-email',
        label: 'Dispatch Reset Email',
        icon: <MailCheck size={15} />,
        tone: 'success',
        onSelect: () => setIsConfirmingSendResetEmail(true),
      },
    );

    // Promotion is SUPER_ADMIN-only, and an existing super admin cannot be re-promoted.
    if (isSuperAdmin && user.role !== 'SUPER_ADMIN') {
      entries.push({
        id: 'promote',
        label: 'Promote to Super Admin',
        icon: <Shield size={15} />,
        tone: 'purple',
        onSelect: () => updateRole({ id: user.id, role: 'SUPER_ADMIN' }),
      });
    }

    // Nobody may trash their own account.
    if (!isSelf) {
      entries.push(
        { separator: true },
        {
          id: 'trash',
          label: 'Move to Trash',
          icon: <Trash2 size={15} />,
          tone: 'danger',
          onSelect: () => setIsConfirmingSoftDelete(true),
        },
      );
    }
  }

  return (
    <>
      <DropdownMenu entries={entries} label="User actions" isBusy={isPending} />

      {/* Confirmation modal for soft delete */}
      <ConfirmDialog
        isOpen={isConfirmingSoftDelete}
        onClose={() => setIsConfirmingSoftDelete(false)}
        onConfirm={() => {
          softDelete(user.id, {
            onSuccess: () => setIsConfirmingSoftDelete(false),
          });
        }}
        title="Move Account to Trash"
        description={`Are you sure you want to deactivate "${user.name}"? Their account will be soft-deleted, all sessions will be revoked, and they will not be able to log in.`}
        confirmLabel="Move to Trash"
        variant="danger"
        isPending={isSoftDeleting}
      />

      {/* Confirmation modal for account restore */}
      <ConfirmDialog
        isOpen={isConfirmingRestore}
        onClose={() => setIsConfirmingRestore(false)}
        onConfirm={() => {
          restore(user.id, {
            onSuccess: () => setIsConfirmingRestore(false),
          });
        }}
        title="Restore User Account"
        description={`Restore user "${user.name}" to the active user directory? They will regain access to sign in.`}
        confirmLabel="Restore Account"
        variant="info"
        isPending={isRestoring}
      />

      {/* Confirmation modal for permanent delete */}
      <ConfirmDialog
        isOpen={isConfirmingPermanentDelete}
        onClose={() => setIsConfirmingPermanentDelete(false)}
        onConfirm={() => {
          permanentDelete(user.id, {
            onSuccess: () => setIsConfirmingPermanentDelete(false),
          });
        }}
        title="Permanently Delete Account"
        description={`WARNING: This will permanently delete user "${user.name}" (${user.email}) and all associated credential and session records from the database. This action CANNOT be undone.`}
        confirmLabel="Permanently Delete"
        variant="critical"
        confirmPhrase="DELETE"
        isPending={isPermDeleting}
      />

      {/* Confirmation modal for sending password reset email */}
      <ConfirmDialog
        isOpen={isConfirmingSendResetEmail}
        onClose={() => setIsConfirmingSendResetEmail(false)}
        onConfirm={() => {
          sendResetEmail(user.id, {
            onSuccess: () => setIsConfirmingSendResetEmail(false),
          });
        }}
        title="Send Password Reset Email"
        description={`Dispatch an official password reset link to "${user.email}"? The link will expire in 60 minutes.`}
        confirmLabel="Send Email"
        variant="info"
        isPending={isSendingEmail}
      />
    </>
  );
};
