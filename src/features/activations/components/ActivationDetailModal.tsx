import React, { useState, useEffect } from 'react';
import {
  X,
  Monitor,
  Key,
  Shield,
  Clock,
  Calendar,
  Building2,
  Copy,
  Check,
  Cpu,
  Radio,
  PauseCircle,
  PlayCircle,
  AlertOctagon,
  Loader2,
} from 'lucide-react';
import { useActivation } from '../api/activationApi';
import type { Activation } from '../api/activationApi';
import { toast } from 'sonner';

interface ActivationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activation: Activation | null;
  onOpenDeactivate?: (act: Activation) => void;
  onOpenReactivate?: (act: Activation) => void;
  onOpenRevoke?: (act: Activation) => void;
}

export const ActivationDetailModal: React.FC<ActivationDetailModalProps> = ({
  isOpen,
  onClose,
  activation: initialActivation,
  onOpenDeactivate,
  onOpenReactivate,
  onOpenRevoke,
}) => {
  const [activeTab, setActiveTab] = useState<'hardware' | 'license' | 'controls'>('hardware');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch full details
  const { data: fullActivation, isLoading } = useActivation(initialActivation?.id);
  const activation = fullActivation || initialActivation;

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

  if (!isOpen || !activation) return null;

  const lastSeenMs = Date.now() - new Date(activation.lastSeenAt).getTime();
  const isOnlineNow = lastSeenMs < 1000 * 60 * 60; // within 1 hour
  const isRecent = lastSeenMs < 1000 * 60 * 60 * 24; // within 24 hours

  const getStatusBadge = () => {
    if (activation.status === 'REVOKED') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          REVOKED
        </span>
      );
    }
    if (activation.status === 'DEACTIVATED') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
          DEACTIVATED
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
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100 shrink-0">
              <Monitor size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {activation.deviceName}
                </h2>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span className="font-mono text-gray-400 select-all">{activation.deviceId}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(activation.deviceId, 'Device UUID')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Copy device UUID"
                >
                  {copiedField === 'Device UUID' ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
                <span className="text-gray-300">•</span>
                <span>{activation.osVersion}</span>
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
            onClick={() => setActiveTab('hardware')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'hardware'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Cpu size={14} />
            Hardware & Telemetry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('license')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'license'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Key size={14} />
            License & Quota
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('controls')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'controls'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Shield size={14} />
            Terminal Controls
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {isLoading && !fullActivation ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading workstation details...</span>
            </div>
          ) : activeTab === 'hardware' ? (
            <div className="space-y-5">
              {/* Telemetry Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isOnlineNow && activation.status === 'ACTIVE'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : isRecent && activation.status === 'ACTIVE'
                    ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isOnlineNow && activation.status === 'ACTIVE'
                        ? 'bg-emerald-500 animate-ping'
                        : isRecent && activation.status === 'ACTIVE'
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      {isOnlineNow && activation.status === 'ACTIVE'
                        ? 'Active Heartbeat — Connected Recently'
                        : isRecent && activation.status === 'ACTIVE'
                        ? 'Operational — Seen within 24 Hours'
                        : 'Station Offline / Idle'}
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">
                      Last verified:{' '}
                      {new Date(activation.lastSeenAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-white/80 rounded-lg shadow-xs">
                  v{activation.appVersion}
                </span>
              </div>

              {/* Hardware Fingerprint Digest */}
              <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Cpu size={13} />
                    Cryptographic Hardware Fingerprint
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(activation.hardwareFingerprint, 'Fingerprint')}
                    className="text-xs text-[#ff8a5c] hover:underline flex items-center gap-1 font-medium"
                  >
                    {copiedField === 'Fingerprint' ? <Check size={11} /> : <Copy size={11} />}
                    <span>Copy Digest</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100 break-all select-all">
                  {activation.hardwareFingerprint}
                </div>
                <p className="text-[11px] text-gray-400">
                  Computed from machine CPU processor ID, motherboard UUID, and system BIOS strings.
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={13} />
                    <span>First Activated</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {new Date(activation.firstActivatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock size={13} />
                    <span>Operating System</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {activation.osVersion}
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Radio size={13} />
                    <span>Desktop App Build</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    Version {activation.appVersion}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'license' ? (
            <div className="space-y-5">
              {activation.license ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Assigned Software License
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {activation.license.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-base font-extrabold text-gray-900 select-all">
                          {activation.license.licenseKey}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Capacity: {activation.license.maxActivations} Workstation Seats • Offline Grace: {activation.license.offlineGraceDays} Days
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(activation.license!.licenseKey, 'License Key')}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white border border-gray-200 transition-colors"
                        title="Copy Key"
                      >
                        {copiedField === 'License Key' ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-white border border-gray-200 rounded-xl">
                      <div className="text-xs text-gray-400">License Expiration</div>
                      <div className="text-sm font-semibold text-gray-800 mt-1">
                        {new Date(activation.license.expiresAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    <div className="p-3.5 bg-white border border-gray-200 rounded-xl">
                      <div className="text-xs text-gray-400">Tenant Center</div>
                      <div className="text-sm font-semibold text-gray-800 mt-1">
                        {activation.institution?.name || 'Assigned Institution'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <Key size={28} className="mx-auto text-gray-400" />
                  <div className="text-sm font-semibold text-gray-700">License Record Not Joined</div>
                  <p className="text-xs text-gray-500 font-mono select-all">{activation.licenseId}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Terminal Governance Controls
                </span>

                <div className="space-y-2.5">
                  {activation.status === 'ACTIVE' && onOpenDeactivate && (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-900">Deactivate Workstation</div>
                        <div className="text-[11px] text-gray-500">
                          Releases 1 seat back to the license pool without revoking hardware.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDeactivate(activation);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <PauseCircle size={13} />
                        <span>Deactivate Seat</span>
                      </button>
                    </div>
                  )}

                  {activation.status === 'DEACTIVATED' && onOpenReactivate && (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-900">Reactivate Workstation</div>
                        <div className="text-[11px] text-gray-500">
                          Re-claims an available seat from the license to resume testing.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenReactivate(activation);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <PlayCircle size={13} />
                        <span>Reactivate Seat</span>
                      </button>
                    </div>
                  )}

                  {activation.status !== 'REVOKED' && onOpenRevoke && (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-red-600">Revoke / Blacklist Terminal</div>
                        <div className="text-[11px] text-gray-500">
                          Permanently blocks this physical PC from taking tests on this platform.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenRevoke(activation);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <AlertOctagon size={13} />
                        <span>Revoke Terminal</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-end shrink-0 bg-white">
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

