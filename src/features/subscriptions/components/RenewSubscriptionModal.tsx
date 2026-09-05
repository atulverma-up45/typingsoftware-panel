import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCw,
  Calendar,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useRenewSubscription } from '../api/subscriptionApi';
import type { Subscription } from '../api/subscriptionApi';
import { usePlans } from '@/features/plans/api/planApi';

interface RenewSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
}

export const RenewSubscriptionModal: React.FC<RenewSubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
}) => {
  const renewSubscriptionMutation = useRenewSubscription();
  const { data: plansData } = usePlans({ limit: 100, status: 'ACTIVE' });
  const plans = plansData?.data || [];

  // Form State
  const [durationDays, setDurationDays] = useState<number>(365);
  const [targetPlanId, setTargetPlanId] = useState<string>('');
  const [autoRenew, setAutoRenew] = useState<boolean>(false);

  // Sync state with subscription
  useEffect(() => {
    if (subscription) {
      setDurationDays(subscription.plan?.durationDays || 365);
      setTargetPlanId(subscription.planId);
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

  // Calculate renewal extension preview
  const currentExpiry = new Date(subscription.expiresAt);
  const now = new Date();
  const baseDate = currentExpiry > now ? currentExpiry : now;
  const newCalculatedExpiry = new Date(
    baseDate.getTime() + (Number(durationDays) || 365) * 24 * 60 * 60 * 1000
  );

  const selectedPlan = plans.find((p) => p.id === targetPlanId) || subscription.plan;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await renewSubscriptionMutation.mutateAsync({
        id: subscription.id,
        data: {
          durationDays: Number(durationDays) || undefined,
          planId: targetPlanId !== subscription.planId ? targetPlanId : undefined,
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
              <RotateCw size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Renew Subscription Contract</h2>
              <p className="text-xs text-gray-500">
                Extend validity period & optionally adjust tier limits
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Customer & Plan Summary */}
          <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Customer:</span>
              <span className="font-bold text-gray-900">
                {subscription.institution?.name || subscription.institutionId}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Contract ID:</span>
              <span className="font-mono text-gray-700">{subscription.id}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Current Status:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {subscription.status}
              </span>
            </div>
          </div>

          {/* Date Comparison Flow */}
          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-2">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
              Contract Expiration Transition
            </span>
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-gray-500 block">Current Expiry</span>
                <span className="font-semibold text-gray-800">
                  {new Date(subscription.expiresAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <ArrowRight size={16} className="text-emerald-600 shrink-0" />
              <div className="text-right">
                <span className="text-emerald-700 font-medium block">New Expiry</span>
                <span className="font-bold text-emerald-900">
                  {newCalculatedExpiry.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Renewal Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Renewal Extension Period
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                { label: '30 Days (1 Month)', value: 30 },
                { label: '90 Days (Quarterly)', value: 90 },
                { label: '180 Days (Half-Year)', value: 180 },
                { label: '365 Days (1 Year)', value: 365 },
                { label: '730 Days (2 Years)', value: 730 },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDurationDays(preset.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    durationDays === preset.value
                      ? 'bg-[#fff0eb] text-[#ff8a5c] border-[#ff8a5c]'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              required
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
            />
          </div>

          {/* Optional Tier Upgrade/Downgrade */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Plan Tier upon Renewal (Optional Upgrade/Downgrade)
            </label>
            <select
              value={targetPlanId}
              onChange={(e) => setTargetPlanId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{(p.price / 100).toLocaleString('en-IN')} ({p.maxActivations} Stations)
                </option>
              ))}
            </select>
            {targetPlanId !== subscription.planId && (
              <p className="text-[11px] text-amber-600 mt-1">
                Note: Updating the tier will adjust the workstation limits for subsequent license generation.
              </p>
            )}
          </div>

          {/* Auto-renew switch */}
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
              <p className="font-semibold text-gray-800">Keep Auto-Renew Enabled</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Automatically flag for subsequent term extensions
              </p>
            </div>
          </div>

          {/* Modal Actions */}
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
              disabled={renewSubscriptionMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {renewSubscriptionMutation.isPending ? 'Renewing...' : 'Confirm Renewal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

