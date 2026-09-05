import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Shield,
  Building2,
  Calendar,
  Clock,
  Monitor,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  useCreateLicense,
  useSubscriptionsForInstitution,
} from '../api/licenseApi';
import type { License, CreateLicenseInput } from '../api/licenseApi';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

interface GenerateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultInstitutionId?: string;
}

export const GenerateLicenseModal: React.FC<GenerateLicenseModalProps> = ({
  isOpen,
  onClose,
  defaultInstitutionId,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Form states
  const [institutionId, setInstitutionId] = useState<string>(
    defaultInstitutionId || currentUser?.institutionId || '',
  );
  const [subscriptionId, setSubscriptionId] = useState<string>('');
  const [maxActivations, setMaxActivations] = useState<number>(5);
  const [offlineGraceDays, setOfflineGraceDays] = useState<number>(14);
  const [customExpiresAt, setCustomExpiresAt] = useState<string>('');

  // Generated license display state
  const [generatedLicense, setGeneratedLicense] = useState<License | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Queries for selectors
  const { data: institutionsData, isLoading: isLoadingInstitutions } = useInstitutions({
    limit: 100,
    status: 'ACTIVE',
  });

  const { data: subscriptionsList, isLoading: isLoadingSubscriptions } =
    useSubscriptionsForInstitution(institutionId);

  // Auto-select first active subscription when list updates
  useEffect(() => {
    if (subscriptionsList && subscriptionsList.length > 0) {
      const activeSub = subscriptionsList.find((s) => s.status === 'ACTIVE') || subscriptionsList[0];
      setSubscriptionId(activeSub.id);
      if (activeSub.plan?.maxDevices) {
        setMaxActivations(activeSub.plan.maxDevices);
      }
    } else {
      setSubscriptionId('');
    }
  }, [subscriptionsList]);

  // Update institutionId if default changes
  useEffect(() => {
    if (defaultInstitutionId) {
      setInstitutionId(defaultInstitutionId);
    } else if (currentUser?.institutionId) {
      setInstitutionId(currentUser.institutionId);
    } else if (institutionsData?.data && institutionsData.data.length > 0 && !institutionId) {
      setInstitutionId(institutionsData.data[0].id);
    }
  }, [defaultInstitutionId, currentUser?.institutionId, institutionsData?.data, institutionId]);

  const createMutation = useCreateLicense();

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !createMutation.isPending) {
        handleModalClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, createMutation.isPending]);

  if (!isOpen) return null;

  const handleModalClose = () => {
    setGeneratedLicense(null);
    setIsCopied(false);
    onClose();
  };

  const handleCopyKey = () => {
    if (!generatedLicense) return;
    navigator.clipboard.writeText(generatedLicense.licenseKey);
    setIsCopied(true);
    toast.success('License key copied to clipboard');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!institutionId) {
      toast.error('Please select an institution');
      return;
    }
    if (!subscriptionId) {
      toast.error('No active subscription found for this institution');
      return;
    }

    const payload: CreateLicenseInput = {
      institutionId,
      subscriptionId,
      maxActivations: Number(maxActivations),
      offlineGraceDays: Number(offlineGraceDays),
      expiresAt: customExpiresAt ? new Date(customExpiresAt).toISOString() : undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: (newLicense) => {
        setGeneratedLicense(newLicense);
      },
    });
  };

  const institutions = institutionsData?.data || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#fff0eb] text-[#ff8a5c] rounded-xl">
              <Key size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {generatedLicense ? 'License Key Minted' : 'Generate Software License'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {generatedLicense
                  ? 'Cryptographic license key created and ready for workstation activation'
                  : 'Provision an authorized workstation license backed by active subscription'}
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            disabled={createMutation.isPending}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {generatedLicense ? (
          /* SUCCESS STATE: MINTED KEY CARD */
          <div className="p-6 space-y-6">
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">License Successfully Generated!</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Deliver this key to the lab administrator for hardware station setup.
                </p>
              </div>

              {/* Monospace Key Display */}
              <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-xs flex items-center justify-between gap-3">
                <span className="font-mono text-base sm:text-lg font-extrabold text-gray-900 tracking-wider select-all">
                  {generatedLicense.licenseKey}
                </span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{isCopied ? 'Copied!' : 'Copy Key'}</span>
                </button>
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 font-medium">Workstation Seats</span>
                <div className="font-bold text-gray-800 text-sm mt-0.5">
                  {generatedLicense.maxActivations} Stations
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 font-medium">Offline Grace</span>
                <div className="font-bold text-gray-800 text-sm mt-0.5">
                  {generatedLicense.offlineGraceDays} Days
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 col-span-2 sm:col-span-1">
                <span className="text-gray-400 font-medium">Valid Until</span>
                <div className="font-bold text-gray-800 text-sm mt-0.5">
                  {new Date(generatedLicense.expiresAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-start gap-2.5 text-blue-900 text-xs">
              <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Desktop Activation:</strong> The lab instructor enters this key into the desktop client setup dialog. The client will bind its CPU/Motherboard hardware fingerprint automatically.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-sm transition-all"
              >
                Done & Return to Directory
              </button>
            </div>
          </div>
        ) : (
          /* FORM INPUT STATE */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Institution Selector (Super Admin) */}
            {isSuperAdmin ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Institution <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Building2 size={16} />
                  </div>
                  <select
                    required
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    disabled={isLoadingInstitutions}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c] bg-white"
                  >
                    <option value="">Select Institution...</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} (@{inst.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {/* Subscription Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Active Subscription Contract <span className="text-red-500">*</span>
                </label>
                {isLoadingSubscriptions && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" /> Loading plans
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FileText size={16} />
                </div>
                <select
                  required
                  value={subscriptionId}
                  onChange={(e) => setSubscriptionId(e.target.value)}
                  disabled={isLoadingSubscriptions || !subscriptionsList || subscriptionsList.length === 0}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c] bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  {!subscriptionsList || subscriptionsList.length === 0 ? (
                    <option value="">No subscriptions available for this institution</option>
                  ) : (
                    subscriptionsList.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.plan?.name || 'Standard Plan'} ({sub.status}) — Expires{' '}
                        {new Date(sub.expiresAt).toLocaleDateString()}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {!subscriptionsList || subscriptionsList.length === 0 ? (
                <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>An active subscription contract is required to provision licenses.</span>
                </p>
              ) : null}
            </div>

            {/* Seats & Offline Grace Days Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Max Workstation Seats <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Monitor size={16} />
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    max={500}
                    value={maxActivations}
                    onChange={(e) => setMaxActivations(parseInt(e.target.value) || 1)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Number of lab PCs allowed to activate</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Offline Grace Period (Days)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Clock size={16} />
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={offlineGraceDays}
                    onChange={(e) => setOfflineGraceDays(parseInt(e.target.value) || 14)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Days client can run offline before re-verifying
                </p>
              </div>
            </div>

            {/* Optional Custom Expiration */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Custom Expiration Date (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Calendar size={16} />
                </div>
                <input
                  type="date"
                  value={customExpiresAt}
                  onChange={(e) => setCustomExpiresAt(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Leave empty to inherit the expiration date from the subscription.
              </p>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !subscriptionId}
                className="px-5 py-2 text-sm font-medium text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                <span>Mint License Key</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

