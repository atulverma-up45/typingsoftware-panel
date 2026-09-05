import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Building2,
  Layers,
  Calendar,
  Key,
  Laptop,
  Check,
  Shield,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { useCreateSubscription } from '../api/subscriptionApi';
import type { CreateSubscriptionInput } from '../api/subscriptionApi';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { usePlans } from '@/features/plans/api/planApi';

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedInstitutionId?: string;
}

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  isOpen,
  onClose,
  preselectedInstitutionId,
}) => {
  const createSubscriptionMutation = useCreateSubscription();

  // Load institutions & active plans
  const { data: institutionsData, isLoading: isLoadingInstitutions } = useInstitutions({
    limit: 100,
    status: 'ACTIVE',
  });
  const { data: plansData, isLoading: isLoadingPlans } = usePlans({
    limit: 100,
    status: 'ACTIVE',
  });

  // Form State
  const [institutionId, setInstitutionId] = useState(preselectedInstitutionId || '');
  const [planId, setPlanId] = useState('');
  const [startsAtDate, setStartsAtDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState<number>(365);
  const [status, setStatus] = useState<'ACTIVE' | 'TRIAL'>('ACTIVE');
  const [autoRenew, setAutoRenew] = useState(false);
  const [createInitialLicense, setCreateInitialLicense] = useState(true);

  const institutions = institutionsData?.data || [];
  const plans = plansData?.data || [];

  // Update durationDays when plan changes
  const selectedPlan = plans.find((p) => p.id === planId);
  useEffect(() => {
    if (selectedPlan && selectedPlan.durationDays) {
      setDurationDays(selectedPlan.durationDays);
    }
  }, [planId, selectedPlan]);

  // Sync preselected institution
  useEffect(() => {
    if (preselectedInstitutionId) {
      setInstitutionId(preselectedInstitutionId);
    }
  }, [preselectedInstitutionId]);

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

  if (!isOpen) return null;

  // Calculate Expiration Date preview
  const startDateObj = startsAtDate ? new Date(startsAtDate) : new Date();
  const calculatedExpiryDate = new Date(
    startDateObj.getTime() + (Number(durationDays) || 365) * 24 * 60 * 60 * 1000
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!institutionId) return;
    if (!planId) return;

    const payload: CreateSubscriptionInput = {
      institutionId,
      planId,
      startsAt: new Date(startsAtDate).toISOString(),
      durationDays: Number(durationDays) || undefined,
      status,
      autoRenew,
      createInitialLicense,
    };

    try {
      await createSubscriptionMutation.mutateAsync(payload);
      onClose();
      // Reset
      setInstitutionId('');
      setPlanId('');
    } catch {
      // Error handled by mutation hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fffaf8]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c]">
              <DollarSign size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Provision Subscription Contract</h2>
              <p className="text-xs text-gray-500">Bind an institution customer to a commercial software tier</p>
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
          {/* Section 1: Customer & Commercial Tier */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              1. Customer Institution & Pricing Tier
            </h3>

            {/* Institution Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Customer Institution <span className="text-rose-500">*</span>
              </label>
              {isLoadingInstitutions ? (
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ) : (
                <select
                  required
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
                >
                  <option value="">-- Select Institution Customer --</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.slug})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Plan Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Commercial Plan Tier <span className="text-rose-500">*</span>
              </label>
              {isLoadingPlans ? (
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ) : (
                <select
                  required
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
                >
                  <option value="">-- Select Commercial Plan --</option>
                  {plans.map((p) => {
                    const priceFormatted = (p.price / 100).toLocaleString('en-IN');
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{priceFormatted} ({p.maxActivations} Seats, {p.durationDays}d)
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Selected Plan Summary Banner */}
            {selectedPlan && (
              <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-900 block">{selectedPlan.name}</span>
                  <span className="text-gray-600 mt-0.5 block">
                    ₹{(selectedPlan.price / 100).toLocaleString('en-IN')} / {selectedPlan.durationDays} days
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-semibold text-orange-800 bg-white px-2 py-1 rounded-lg border border-orange-200">
                    <Laptop size={13} className="text-[#ff8a5c]" />
                    {selectedPlan.maxActivations} Stations
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Contract Validity Dates */}
          <div className="space-y-4 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              2. Contract Term & Validity Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Contract Effective Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startsAtDate}
                  onChange={(e) => setStartsAtDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Term Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
                />
              </div>
            </div>

            {/* Calculated Expiry Banner */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <span className="font-medium">Calculated Expiration Date:</span>
              <span className="font-bold">
                {calculatedExpiryDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Section 3: Status & Automation Options */}
          <div className="space-y-4 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              3. Operational Status & Provisioning Automation
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-800">Initial Contract Status</p>
                <p className="text-[11px] text-gray-500">Trial subscriptions can be converted later</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('ACTIVE')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Active Contract
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('TRIAL')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    status === 'TRIAL'
                      ? 'bg-amber-50 text-amber-700 border-amber-300 font-semibold'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Free Trial
                </button>
              </div>
            </div>

            {/* Auto-Renew Option */}
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
                <p className="font-semibold text-gray-800">Automatic Renewal Enabled</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Flag this institutional contract for automated invoice generation & term extension upon expiry
                </p>
              </div>
            </div>

            {/* Auto-generate Initial License Key */}
            <div
              onClick={() => setCreateInitialLicense(!createInitialLicense)}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={createInitialLicense}
                onChange={() => setCreateInitialLicense(!createInitialLicense)}
                className="mt-0.5 h-4 w-4 rounded text-[#ff8a5c] accent-[#ff8a5c]"
              />
              <div className="text-xs">
                <p className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <Key size={14} className="text-emerald-600" />
                  Auto-Generate Initial License Key (Recommended)
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Automatically generates a cryptographically random license key with this plan's workstation seat limit ({selectedPlan?.maxActivations || 5} PCs) so the lab can activate immediately.
                </p>
              </div>
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
              disabled={createSubscriptionMutation.isPending || !institutionId || !planId}
              className="px-5 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {createSubscriptionMutation.isPending
                ? 'Provisioning...'
                : 'Provision Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

