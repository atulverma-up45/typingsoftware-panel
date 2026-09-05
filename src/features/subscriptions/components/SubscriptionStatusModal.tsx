import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  PauseCircle,
} from 'lucide-react';
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

  useEffect(() => {
    if (subscription) {
      setStatus(subscription.status);
      setReason('');
    }
  }, [subscription]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fffaf8]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c]">
              <ShieldAlert size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Transition Contract Status</h2>
              <p className="text-xs text-gray-500">Safely alter commercial operational state</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                    className="mt-0.5 h-4 w-4 text-[#ff8a5c] accent-[#ff8a5c]"
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
              className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStatusMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

