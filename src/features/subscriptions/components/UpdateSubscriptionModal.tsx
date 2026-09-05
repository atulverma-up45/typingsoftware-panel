import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Calendar,
  Layers,
  Clock,
} from 'lucide-react';
import { useUpdateSubscription } from '../api/subscriptionApi';
import type { Subscription, SubscriptionStatus } from '../api/subscriptionApi';

interface UpdateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
}

export const UpdateSubscriptionModal: React.FC<UpdateSubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
}) => {
  const updateSubscriptionMutation = useUpdateSubscription();

  const [status, setStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [expiresAtDate, setExpiresAtDate] = useState<string>('');
  const [autoRenew, setAutoRenew] = useState<boolean>(false);

  useEffect(() => {
    if (subscription) {
      setStatus(subscription.status);
      setExpiresAtDate(new Date(subscription.expiresAt).toISOString().split('T')[0]);
      setAutoRenew(subscription.autoRenew);
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
      await updateSubscriptionMutation.mutateAsync({
        id: subscription.id,
        data: {
          status,
          expiresAt: expiresAtDate ? new Date(expiresAtDate).toISOString() : undefined,
          autoRenew,
        },
      });
      onClose();
    } catch {
      // Error handled by mutation hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fffaf8]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c]">
              <Edit3 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Update Subscription Contract</h2>
              <p className="text-xs text-gray-500">Modify contract validity date and automation settings</p>
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
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer:</span>
              <span className="font-bold text-gray-900">
                {subscription.institution?.name || subscription.institutionId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Plan:</span>
              <span className="font-semibold text-gray-800">{subscription.plan?.name || subscription.planId}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Operational Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
            >
              <option value="ACTIVE">ACTIVE (In Good Standing)</option>
              <option value="TRIAL">TRIAL (Evaluation Period)</option>
              <option value="PAST_DUE">PAST_DUE (Awaiting Payment)</option>
              <option value="SUSPENDED">SUSPENDED (Temporarily Blocked)</option>
              <option value="EXPIRED">EXPIRED (Term Concluded)</option>
              <option value="CANCELLED">CANCELLED (Terminated)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Contract Expiration Date
            </label>
            <input
              type="date"
              required
              value={expiresAtDate}
              onChange={(e) => setExpiresAtDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
            />
          </div>

          <div
            onClick={() => setAutoRenew(!autoRenew)}
            className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer select-none hover:bg-gray-50/50"
          >
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={() => setAutoRenew(!autoRenew)}
              className="mt-0.5 h-4 w-4 rounded text-[#ff8a5c] accent-[#ff8a5c]"
            />
            <div className="text-xs">
              <p className="font-semibold text-gray-800">Auto-Renewal Flag</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Enable automated term extension checks
              </p>
            </div>
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
              disabled={updateSubscriptionMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {updateSubscriptionMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

