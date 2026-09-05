import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  KeyRound,
  Eye,
  RotateCcw,
  Trash,
  MailCheck,
  ShieldAlert,
  Loader2,
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
import { ConfirmationModal } from './ConfirmationModal';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dialog triggers
  const [isConfirmingSoftDelete, setIsConfirmingSoftDelete] = useState(false);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [isConfirmingPermanentDelete, setIsConfirmingPermanentDelete] = useState(false);
  const [isConfirmingSendResetEmail, setIsConfirmingSendResetEmail] = useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const isSelf = currentUser?.id === user.id;
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateUserRole();
  const { mutate: softDelete, isPending: isSoftDeleting } = useSoftDeleteUser();
  const { mutate: restore, isPending: isRestoring } = useRestoreUser();
  const { mutate: permanentDelete, isPending: isPermDeleting } = usePermanentDeleteUser();
  const { mutate: sendResetEmail, isPending: isSendingEmail } = useSendResetPasswordEmail();

  const isPending =
    isUpdatingRole || isSoftDeleting || isRestoring || isPermDeleting || isSendingEmail;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const isDeleted = user.deletedAt !== null;

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50"
          title="User actions"
        >
          {isPending ? <Loader2 size={18} className="animate-spin text-[#ff8a5c]" /> : <MoreVertical size={18} />}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-56 rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden z-50 transform origin-top-right transition-all duration-150 animate-in fade-in zoom-in-95">
            <div className="p-1.5 space-y-1">
              {/* View Details & Sessions */}
              <button
                onClick={() => handleAction(() => onViewDetails?.(user))}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Eye size={15} className="text-indigo-500" /> View Details & Sessions
              </button>

              {!isDeleted ? (
                <>
                  {/* Edit Details */}
                  <button
                    onClick={() => handleAction(() => onEdit?.(user))}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <Edit size={15} className="text-blue-500" /> Edit Profile Details
                  </button>

                  {/* Change Status */}
                  <button
                    onClick={() => handleAction(() => onChangeStatus?.(user))}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <ShieldAlert size={15} className="text-orange-500" /> Change Account Status
                  </button>

                  {/* Reset Password */}
                  <button
                    onClick={() => handleAction(() => onResetPassword?.(user))}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <KeyRound size={15} className="text-amber-500" /> Reset Password
                  </button>

                  {/* Send Reset Email */}
                  <button
                    onClick={() => handleAction(() => setIsConfirmingSendResetEmail(true))}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <MailCheck size={15} className="text-emerald-500" /> Dispatch Reset Email
                  </button>

                  {/* Make Super Admin (Super Admin only, and cannot promote existing super admin) */}
                  {isSuperAdmin && user.role !== 'SUPER_ADMIN' && (
                    <button
                      onClick={() =>
                        handleAction(() => updateRole({ id: user.id, role: 'SUPER_ADMIN' }))
                      }
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50 rounded-xl transition-colors"
                    >
                      <Shield size={15} className="text-purple-500" /> Promote to Super Admin
                    </button>
                  )}

                  {/* Soft Delete Account (Cannot delete own account) */}
                  {!isSelf && (
                    <>
                      <div className="h-px bg-gray-100 my-1 mx-2" />
                      <button
                        onClick={() => handleAction(() => setIsConfirmingSoftDelete(true))}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={15} /> Move to Trash
                      </button>
                    </>
                  )}
                </>
              ) : (
                /* Deleted Account Actions (Super Admin only) */
                isSuperAdmin && (
                  <>
                    <button
                      onClick={() => handleAction(() => setIsConfirmingRestore(true))}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      <RotateCcw size={15} /> Restore Account
                    </button>
                    <div className="h-px bg-gray-100 my-1 mx-2" />
                    <button
                      onClick={() => handleAction(() => setIsConfirmingPermanentDelete(true))}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash size={15} /> Permanently Delete
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal for soft delete */}
      <ConfirmationModal
        isOpen={isConfirmingSoftDelete}
        onClose={() => setIsConfirmingSoftDelete(false)}
        onConfirm={() => {
          softDelete(user.id, {
            onSuccess: () => setIsConfirmingSoftDelete(false),
          });
        }}
        title="Move Account to Trash"
        description={`Are you sure you want to deactivate "${user.name}"? Their account will be soft-deleted, all sessions will be revoked, and they will not be able to log in.`}
        confirmText="Move to Trash"
        variant="danger"
        isLoading={isSoftDeleting}
      />

      {/* Confirmation modal for account restore */}
      <ConfirmationModal
        isOpen={isConfirmingRestore}
        onClose={() => setIsConfirmingRestore(false)}
        onConfirm={() => {
          restore(user.id, {
            onSuccess: () => setIsConfirmingRestore(false),
          });
        }}
        title="Restore User Account"
        description={`Restore user "${user.name}" to the active user directory? They will regain access to sign in.`}
        confirmText="Restore Account"
        variant="info"
        isLoading={isRestoring}
      />

      {/* Confirmation modal for permanent delete */}
      <ConfirmationModal
        isOpen={isConfirmingPermanentDelete}
        onClose={() => setIsConfirmingPermanentDelete(false)}
        onConfirm={() => {
          permanentDelete(user.id, {
            onSuccess: () => setIsConfirmingPermanentDelete(false),
          });
        }}
        title="Permanently Delete Account"
        description={`WARNING: This will permanently delete user "${user.name}" (${user.email}) and all associated credential and session records from the database. This action CANNOT be undone.`}
        confirmText="Permanently Delete"
        variant="critical"
        requireConfirmationText="DELETE"
        isLoading={isPermDeleting}
      />

      {/* Confirmation modal for sending password reset email */}
      <ConfirmationModal
        isOpen={isConfirmingSendResetEmail}
        onClose={() => setIsConfirmingSendResetEmail(false)}
        onConfirm={() => {
          sendResetEmail(user.id, {
            onSuccess: () => setIsConfirmingSendResetEmail(false),
          });
        }}
        title="Send Password Reset Email"
        description={`Dispatch an official password reset link to "${user.email}"? The link will expire in 60 minutes.`}
        confirmText="Send Email"
        variant="info"
        isLoading={isSendingEmail}
      />
    </>
  );
};
