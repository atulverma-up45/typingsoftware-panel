import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Shield,
  Monitor,
  FileText,
  Copy,
  Check,
  Calendar,
  Clock,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Radio,
  ExternalLink,
  Edit2,
  AlertOctagon,
  Loader2,
} from 'lucide-react';
import { useLicense } from '../api/licenseApi';
import type { License } from '../api/licenseApi';
import { toast } from 'sonner';

interface LicenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: License | null;
  onOpenEdit?: (lic: License) => void;
  onOpenRevoke?: (lic: License) => void;
}

export const LicenseDetailModal: React.FC<LicenseDetailModalProps> = ({
  isOpen,
  onClose,
  license: initialLicense,
  onOpenEdit,
  onOpenRevoke,
}) => {
  const [activeTab, setActiveTab] = useState<'specs' | 'devices' | 'subscription'>('specs');
  const [isKeyMasked, setIsKeyMasked] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch full live joined relations (activations, institution, subscription, plan)
  const { data: fullLicense, isLoading } = useLicense(initialLicense?.id);

  const license = fullLicense || initialLicense;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !license) return null;

  const activations = license.activations || [];
  const usedSeats = activations.length;
  const maxSeats = license.maxActivations || 1;
  const seatPercentage = Math.min(100, Math.round((usedSeats / maxSeats) * 100));

  const isExpired = new Date(license.expiresAt).getTime() < Date.now();

  const getStatusBadge = () => {
    if (license.status === 'REVOKED') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          REVOKED
        </span>
      );
    }
    if (license.status === 'SUSPENDED') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          SUSPENDED
        </span>
      );
    }
    if (isExpired || license.status === 'EXPIRED') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
          EXPIRED
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>ACTIVE</span>
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#fff0eb] text-[#ff8a5c] font-bold flex items-center justify-center border border-[#ff8a5c]/20 shrink-0">
              <Key size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-extrabold text-gray-900 tracking-wider select-all">
                  {isKeyMasked
                    ? `${license.licenseKey.slice(0, 8)}••••-••••-${license.licenseKey.slice(-4)}`
                    : license.licenseKey}
                </span>
                <button
                  type="button"
                  onClick={() => setIsKeyMasked(!isKeyMasked)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title={isKeyMasked ? 'Show key' : 'Mask key'}
                >
                  {isKeyMasked ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(license.licenseKey, 'License Key')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Copy license key"
                >
                  {copiedField === 'License Key' ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Building2 size={13} className="text-gray-400" />
                <span>{license.institution?.name || 'Assigned Institution'}</span>
                <span className="text-gray-300">•</span>
                <span className="font-mono text-gray-400 select-all">{license.id}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'specs'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Shield size={14} />
            License & Cryptography
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('devices')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'devices'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Monitor size={14} />
            <span>Connected Workstations</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
              {usedSeats}/{maxSeats}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscription')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'subscription'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText size={14} />
            Subscription & Plan
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {isLoading && !fullLicense ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading license details...</span>
            </div>
          ) : activeTab === 'specs' ? (
            <div className="space-y-5">
              {/* Seat Capacity Bar */}
              <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <Monitor size={14} className="text-gray-500" />
                    Workstation Seat Saturation
                  </span>
                  <span className="font-bold text-gray-900">
                    {usedSeats} of {maxSeats} Seats Used ({seatPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      seatPercentage >= 100
                        ? 'bg-purple-600'
                        : seatPercentage >= 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${seatPercentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  {maxSeats - usedSeats} workstation seats currently available for new station activations.
                </p>
              </div>

              {/* Cryptographic SHA-256 Hash */}
              <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Lock size={13} />
                    SHA-256 Key Hash
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(license.keyHash, 'Key Hash')}
                    className="text-xs text-[#ff8a5c] hover:underline flex items-center gap-1"
                  >
                    {copiedField === 'Key Hash' ? <Check size={11} /> : <Copy size={11} />}
                    <span>Copy Hash</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100 break-all select-all">
                  {license.keyHash}
                </div>
                <p className="text-[11px] text-gray-400">
                  Stored as a cryptographic digest for constant-time offline and online verification.
                </p>
              </div>

              {/* Timing and Grace Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={13} />
                    <span>Issued Date</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {new Date(license.issuedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock size={13} />
                    <span>Expiration Date</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {new Date(license.expiresAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Radio size={13} />
                    <span>Offline Grace</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {license.offlineGraceDays} Days Allowed
                  </div>
                </div>
              </div>

              {/* Institution Context */}
              {license.institution && (
                <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Institutional Tenant
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {license.institution.name}
                      </h4>
                      <div className="text-xs text-gray-500">
                        Official contact: {license.institution.email}
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-gray-100 px-2.5 py-1 rounded-lg text-gray-700">
                      @{license.institution.slug}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'devices' ? (
            <div className="space-y-4">
              {activations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <Monitor size={32} className="mx-auto text-gray-400" />
                  <h4 className="text-sm font-bold text-gray-800">No Workstations Activated Yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Provide key <span className="font-mono font-bold select-all">{license.licenseKey}</span> to your lab instructor to authorize desktop stations.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Showing <strong className="text-gray-900">{activations.length}</strong> active workstation terminal(s)
                    </span>
                    <span className="font-mono text-[11px] text-gray-400">Hardware Bound</span>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {activations.map((act) => (
                      <div
                        key={act.id}
                        className="p-3.5 bg-white hover:bg-gray-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900">
                              {act.deviceName || act.device?.deviceName || 'Lab Workstation'}
                            </span>
                            <span className="px-2 py-0.2 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                              {act.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 font-mono">
                            <span>OS: {act.osVersion || act.device?.os || 'Windows'}</span>
                            <span>•</span>
                            <span>App: v{act.appVersion || '1.0.0'}</span>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">
                              FP: {act.hardwareFingerprint?.slice(0, 12)}...
                            </span>
                          </div>
                        </div>

                        <div className="text-right text-xs text-gray-500">
                          <div>
                            Activated:{' '}
                            <span className="font-medium text-gray-700">
                              {new Date(act.activatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Heartbeat:{' '}
                            {new Date(act.lastVerifiedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {license.subscription ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Commercial Subscription
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {license.subscription.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-400">Contract Plan</div>
                        <div className="text-base font-bold text-gray-900 mt-0.5">
                          {license.subscription.plan?.name || 'Commercial Plan'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          Code: {license.subscription.plan?.code || 'N/A'}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400">Subscription Expiration</div>
                        <div className="text-sm font-semibold text-gray-800 mt-1">
                          {new Date(license.subscription.expiresAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1 text-xs text-gray-500">
                    <div className="font-semibold text-gray-700">Contract Identifier:</div>
                    <div className="font-mono text-gray-600 select-all">
                      {license.subscription.id}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <FileText size={28} className="mx-auto text-gray-400" />
                  <div className="text-sm font-semibold text-gray-700">
                    No Direct Subscription Record Joined
                  </div>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Subscription ID: <span className="font-mono select-all">{license.subscriptionId}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            {onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(license);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Edit2 size={13} />
                <span>Edit Seat Limits</span>
              </button>
            )}
            {onOpenRevoke && license.status !== 'REVOKED' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRevoke(license);
                }}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <AlertOctagon size={13} />
                <span>Revoke Key</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};

