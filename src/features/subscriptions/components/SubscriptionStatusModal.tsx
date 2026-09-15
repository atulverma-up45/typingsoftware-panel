import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  PauseCircle,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useUpdateSubscriptionStatus } from '../api/subscriptionApi';
import type { Subscription, SubscriptionStatus } from '../api/subscriptionApi';

interface SubscriptionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
}

export const SubscriptionStatusModal: React.FC<SubscriptionStatusModalProps> = ({
  isOpen,
  onClose,
  subscription,
}) => {
  const updateStatusMutation = useUpdateSubscriptionStatus();

  const [status, setStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [reason, setReason] = useState('');

  // Sync the current status + clear the reason on every open — render-phase state
  // adjustment (pattern used by ConfirmDialog). Keyed on the subscription id, so
  // reopening for the same subscription re-syncs (consistent with sibling modals).
  const [lastSyncedSubscriptionId, setLastSyncedSubscriptionId] = useState<string | null>(null);
  const syncedSubscriptionId = isOpen && subscription ? subscription.id : null;
  if (syncedSubscriptionId !== lastSyncedSubscriptionId) {
    setLastSyncedSubscriptionId(syncedSubscriptionId);
    if (subscription && isOpen) {
      setStatus(subscription.status);
      setReason('');
    }
  }

  if (!isOpen || !subscription) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateStatusMutation.mutateAsync({
        id: subscription.id,
        data: {
          status,
          reason: reason.trim() || undefined,
        },
      });
      onClose();
    } catch {
      // Handled by hook
    }
  };

  const statusOptions: Array<{
    status: SubscriptionStatus;
    label: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      status: 'ACTIVE',
      label: 'Active (Normal Operations)',
      desc: 'All workstation client licenses remain authorized and functional',
      icon: <CheckCircle2 size={16} className="text-emerald-500" />,
      color: 'border-emerald-200 bg-emerald-50/40',
    },
    {
      status: 'TRIAL',
      label: 'Trial Evaluation',
      desc: 'Evaluation mode for onboarding demo or pilot program',
      icon: <Clock size={16} className="text-blue-500" />,
      color: 'border-blue-200 bg-blue-50/40',
    },
    {
      status: 'PAST_DUE',
      label: 'Past Due (Grace Period)',
      desc: 'Institutional billing invoice is overdue, workstation warnings active',
      icon: <AlertTriangle size={16} className="text-amber-500" />,
      color: 'border-amber-200 bg-amber-50/40',
    },
    {
      status: 'SUSPENDED',
      label: 'Suspended (Blocked)',
      desc: 'Temporarily halts desktop software access due to billing dispute or compliance',
      icon: <PauseCircle size={16} className="text-purple-500" />,
      color: 'border-purple-200 bg-purple-50/40',
    },
    {
      status: 'EXPIRED',
      label: 'Expired (Term Concluded)',
      desc: 'Contract term has ended without renewal',
      icon: <Clock size={16} className="text-gray-500" />,
      color: 'border-gray-200 bg-gray-50/40',
    },
    {
      status: 'CANCELLED',
      label: 'Cancelled (Terminated)',
      desc: 'Contract formally terminated by customer or administrator',
      icon: <Ban size={16} className="text-rose-500" />,
      color: 'border-rose-200 bg-rose-50/40',
    },
  ];

  return (
    <Modal
      isOpen={isOpen && !!subscription}
      onClose={onClose}
      size="lg"
      title="Transition Contract Status"
      description="Safely alter commercial operational state"
      icon={<ShieldAlert size={20} strokeWidth={2.2} />}
      accentClassName="bg-primary-100 text-primary border-primary-200"
      closeOnBackdrop={!updateStatusMutation.isPending}
      closeOnEscape={!updateStatusMutation.isPending}
      showCloseButton={!updateStatusMutation.isPending}
      bodyClassName="p-6"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={updateStatusMutation.isPending}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="subscription-status-form"
            disabled={updateStatusMutation.isPending}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </button>
        </>
      }
    >
      <form id="subscription-status-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Select Target Status
          </label>
          <div className="space-y-2">
            {statusOptions.map((opt) => (
              <div
                key={opt.status}
                onClick={() => setStatus(opt.status)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  status === opt.status
                    ? `${opt.color} shadow-2xs font-medium`
                    : 'border-gray-200 hover:bg-gray-50/60'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  checked={status === opt.status}
                  onChange={() => setStatus(opt.status)}
                  className="mt-0.5 h-4 w-4 text-primary accent-primary"
                />
                <div className="text-xs">
                  <div className="flex items-center gap-1.5">
                    {opt.icon}
                    <span className="font-bold text-gray-900">{opt.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Audit Reason / Justification (Optional)
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Approved 7-day payment extension, Customer initiated cancellation..."
            className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </form>
    </Modal>
  );
};
