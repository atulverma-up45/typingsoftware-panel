import React, { useState, useEffect } from 'react';
import { X, Mail, User as UserIcon, Shield, Building, Loader2, AlertCircle } from 'lucide-react';
import {
  type User,
  type UserRole,
  useUpdateUser,
  useUpdateUserRole,
  useInstitutions,
} from '../api/userApi';
import { useAuthStore } from '@/stores/auth.store';

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditUserModalContent: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [institutionId, setInstitutionId] = useState(user.institutionId || '');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const { data: institutions = [], isLoading: isLoadingInstitutions } = useInstitutions(
    isSuperAdmin,
  );

  const { mutate: updateUser, isPending: isUpdatingUser } = useUpdateUser();
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateUserRole();

  const isPending = isUpdatingUser || isUpdatingRole;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const hasProfileChanges = name.trim() !== user.name || email.trim() !== user.email;
    const hasRoleChanges =
      isSuperAdmin &&
      (role !== user.role || institutionId.trim() !== (user.institutionId || ''));

    const handleRoleUpdate = () => {
      if (hasRoleChanges) {
        updateRole(
          {
            id: user.id,
            role,
            institutionId: institutionId.trim() || null,
          },
          {
            onSuccess: () => onClose(),
          },
        );
      } else {
        onClose();
      }
    };

    if (hasProfileChanges) {
      updateUser(
        {
          id: user.id,
          data: {
            name: name.trim(),
            email: email.trim(),
          },
        },
        {
          onSuccess: () => {
            handleRoleUpdate();
          },
        },
      );
    } else if (hasRoleChanges) {
      handleRoleUpdate();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <UserIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Edit User Details</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Update account profile and system permissions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User full name"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 transition-all"
              />
            </div>
          </div>

          {isSuperAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  System Role
                </label>
                <div className="relative">
                  <Shield
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={18}
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-8 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 appearance-none cursor-pointer"
                  >
                    <option value="SUPER_ADMIN">Super Administrator</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="SUPPORT">Support Specialist</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Institution Assignment
                </label>
                <div className="relative">
                  <Building
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={18}
                  />
                  <select
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    disabled={role === 'SUPER_ADMIN'}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-8 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">None (Global Platform)</option>
                    {isLoadingInstitutions ? (
                      <option disabled>Loading institutions...</option>
                    ) : (
                      institutions.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} ({inst.slug})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="col-span-full">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-700 text-xs">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>Modifying user role or institution will automatically invalidate their current sessions.</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-[#ff8a5c] hover:bg-[#f77947] rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;
  return <EditUserModalContent key={user.id} user={user} onClose={onClose} />;
};
