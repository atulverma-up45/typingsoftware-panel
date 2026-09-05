import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Ban, Loader2 } from 'lucide-react';
import { type User, type UserStatus, useUpdateUserStatus } from '../api/userApi';

interface StatusChangeModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusOptions: Array<{
  value: UserStatus;
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'ACTIVE',
    label: 'Active Account',
    description: 'User has full platform access and can sign in without restrictions.',
    color: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400',
    icon: <CheckCircle2 size={18} className="text-emerald-600" />,
  },
  {
    value: 'INACTIVE',
    label: 'Inactive Account',
    description: 'Temporarily dormant account. User may not be permitted to sign in until reactivated.',
    color: 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400',
    icon: <AlertTriangle size={18} className="text-gray-500" />,
  },
  {
    value: 'SUSPENDED',
    label: 'Suspended Account',
    description: 'Sign-in blocked immediately. All active device sessions will be revoked.',
    color: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400',
    icon: <AlertTriangle size={18} className="text-amber-600" />,
  },
  {
    value: 'BANNED',
    label: 'Banned Account',
    description: 'Permanently blocked from signing in. All active sessions revoked immediately.',
    color: 'border-red-200 bg-red-50 text-red-700 hover:border-red-400',
    icon: <Ban size={18} className="text-red-600" />,
  },
];

const StatusChangeModalContent: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>(user.status);

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

  const { mutate: updateStatus, isPending } = useUpdateUserStatus();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === user.status) {
      onClose();
      return;
    }

    updateStatus(
      { id: user.id, status: selectedStatus },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  const willRevokeSessions = selectedStatus !== 'ACTIVE' && user.status === 'ACTIVE';

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
            <div className="p-2.5 rounded-xl bg-orange-50 text-[#ff8a5c] border border-orange-100">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Change Account Status</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Managing access state for <span className="font-semibold text-gray-800">{user.name}</span>
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
          <div className="space-y-2.5">
            {statusOptions.map((opt) => {
              const isSelected = selectedStatus === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'border-[#ff8a5c] bg-orange-50/30 ring-1 ring-[#ff8a5c]/20'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{opt.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                      {user.status === opt.value && (
                        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{opt.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {willRevokeSessions && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 text-xs">
              <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
              <p>
                <strong>Security note:</strong> Transitioning this user to <strong>{selectedStatus}</strong> will immediately terminate all active sessions and device tokens.
              </p>
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
              className="px-4 py-2 text-sm font-medium text-white bg-[#ff8a5c] hover:bg-[#f77947] rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;
  return <StatusChangeModalContent key={user.id} user={user} onClose={onClose} />;
};

