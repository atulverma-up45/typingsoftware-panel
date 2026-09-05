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
  Copy,
  Clock,
  ExternalLink,
  RotateCw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Subscription } from '../api/subscriptionApi';

interface SubscriptionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onRenew?: (subscription: Subscription) => void;
}

export const SubscriptionDetailModal: React.FC<SubscriptionDetailModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onRenew,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'CONTRACT' | 'PLAN' | 'LICENSES'>('CONTRACT');

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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const now = new Date();
  const expiryDate = new Date(subscription.expiresAt);
  const startDate = new Date(subscription.startsAt);
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays <= 0;

  const plan = subscription.plan;
  const features = (plan?.features || {}) as Record<string, any>;
  const licenses = subscription.licenses || [];

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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  {subscription.institution?.name || 'Institutional Customer'}
                </h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    subscription.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : subscription.status === 'TRIAL'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : subscription.status === 'PAST_DUE'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {subscription.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">Contract ID: {subscription.id}</p>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-white gap-2">
          {[
            { id: 'CONTRACT', label: 'Contract & Billing' },
            { id: 'PLAN', label: 'Plan Features & Quotas' },
            { id: 'LICENSES', label: `Issued Licenses (${licenses.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#ff8a5c] text-[#ff8a5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* TAB 1: CONTRACT */}
          {activeTab === 'CONTRACT' && (
            <div className="space-y-4">
              {/* Validity Progress Meter */}
              <div
                className={`p-4 rounded-xl border ${
                  isExpired
                    ? 'bg-rose-50/50 border-rose-200'
                    : diffDays <= 30
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-emerald-50/40 border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-gray-700">Contract Validity Remaining</span>
                  <span
                    className={`font-bold ${
                      isExpired
                        ? 'text-rose-600'
                        : diffDays <= 30
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {isExpired
                      ? `Expired ${Math.abs(diffDays)} days ago`
                      : `${diffDays} days remaining`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isExpired ? 'bg-rose-500' : diffDays <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: isExpired ? '100%' : `${Math.min(100, Math.max(5, (diffDays / 365) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 mt-2">
                  <span>
                    Starts:{' '}
                    {startDate.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span>
                    Expires:{' '}
                    {expiryDate.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Assigned Tier
                  </span>
                  <span className="text-sm font-bold text-gray-900 mt-1 block">
                    {plan?.name || 'Custom Tier'}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    ₹{((plan?.price || 0) / 100).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Workstation Cap
                  </span>
                  <span className="text-sm font-bold text-gray-900 mt-1 block flex items-center gap-1">
                    <Laptop size={15} className="text-[#ff8a5c]" />
                    {plan?.maxActivations || 5} Stations
                  </span>
                  <span className="text-[11px] text-gray-500">Authorized seats</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Auto-Renewal
                  </span>
                  <span className="text-sm font-bold text-gray-900 mt-1 block">
                    {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                  </span>
                  <span className="text-[11px] text-gray-500">Term automation</span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Subscription ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-gray-800">{subscription.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(subscription.id, 'Subscription ID')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Institution</span>
                  <span className="font-semibold text-gray-800">
                    {subscription.institution?.name} ({subscription.institution?.slug})
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Created At</span>
                  <span className="text-gray-800">
                    {new Date(subscription.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">Last Modified</span>
                  <span className="text-gray-800">
                    {new Date(subscription.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLAN */}
          {activeTab === 'PLAN' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-900">{plan?.name}</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {plan?.description || 'Commercial typing software tier.'}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Entitled Capabilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'English Typing Engine', enabled: !!features.englishTyping },
                    { label: 'Hindi Typing & Font Engines', enabled: !!features.hindiTyping },
                    { label: 'Govt Exam Simulator Sets', enabled: !!features.governmentExams },
                    { label: 'Student Management & Batches', enabled: !!features.studentManagement },
                    { label: 'White-Label Custom Branding', enabled: !!features.customBranding },
                    { label: 'Advanced Analytics Reports', enabled: !!features.advancedReports },
                  ].map((feat, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                        feat.enabled
                          ? 'bg-emerald-50/30 border-emerald-100 text-gray-800'
                          : 'bg-gray-50 border-gray-100 text-gray-400 line-through'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                          feat.enabled
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {feat.enabled ? <Check size={10} strokeWidth={3} /> : <X size={10} />}
                      </div>
                      <span className="text-xs font-medium">{feat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900">
                <span className="font-semibold">Offline Grace Allowance:</span>{' '}
                {features.offlineGraceDays || 14} days uninterrupted without internet connection before license validation lockout.
              </div>
            </div>
          )}

          {/* TAB 3: LICENSES */}
          {activeTab === 'LICENSES' && (
            <div className="space-y-3">
              {licenses.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                  <Key size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs font-semibold text-gray-700">No License Keys Issued Yet</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Generate a license key from the Licenses management page.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {licenses.map((lic) => {
                    const activeActivations = (lic.activations || []).filter(
                      (a: any) => a.status === 'ACTIVE'
                    ).length;

                    return (
                      <div
                        key={lic.id}
                        className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Key size={16} className="text-[#ff8a5c]" />
                            <span className="font-mono text-xs font-bold text-gray-900">
                              {lic.licenseKey}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(lic.licenseKey, 'License Key')}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              lic.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {lic.status}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Laptop size={13} className="text-gray-400" />
                            Workstation Seats: <strong className="text-gray-800">{activeActivations} / {lic.maxActivations}</strong>
                          </span>
                          <span>
                            Expires:{' '}
                            {new Date(lic.expiresAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {onRenew && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRenew(subscription);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#ff8a5c] bg-[#fff0eb] hover:bg-[#ffe2d6] rounded-xl transition-colors"
            >
              <RotateCw size={13} />
              Renew Contract
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

