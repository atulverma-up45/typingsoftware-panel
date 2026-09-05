import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, PauseCircle, ShieldAlert, Loader2, Key } from 'lucide-react';
import { useUpdateLicenseStatus } from '../api/licenseApi';
import type { License, LicenseStatus } from '../api/licenseApi';

interface LicenseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: License | null;
}

export const LicenseStatusModal: React.FC<LicenseStatusModalProps> = ({
  isOpen,
  onClose,
  license,
}) => {
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'REVOKED'>('ACTIVE');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (license) {
      setTargetStatus(
        license.status === 'ACTIVE'
          ? 'SUSPENDED'
          : license.status === 'SUSPENDED'
          ? 'ACTIVE'
          : 'SUSPENDED',
      );
      setReason('');
    }
  }, [license]);

  const updateStatusMutation = useUpdateLicenseStatus();

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !updateStatusMutation.isPending) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, updateStatusMutation.isPending]);

  if (!isOpen || !license) return null;

  const isCurrentStatus = license.status === targetStatus;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentStatus) return;

    updateStatusMutation.mutate(
      {
        id: license.id,
        data: {
          status: targetStatus,
          reason: reason.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                targetStatus === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-600'
                  : targetStatus === 'SUSPENDED'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {targetStatus === 'ACTIVE' ? (
                <CheckCircle2 size={22} />
              ) : targetStatus === 'SUSPENDED' ? (
                <PauseCircle size={22} />
              ) : (
                <ShieldAlert size={22} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Change License Status</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Current status:{' '}
                <span className="font-semibold text-gray-800">{license.status}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={updateStatusMutation.isPending}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-xs">
            <Key size={14} className="text-gray-400" />
            <span className="font-mono font-bold text-gray-800">{license.licenseKey}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Select Target Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetStatus('ACTIVE')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  targetStatus === 'ACTIVE'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <CheckCircle2
                  size={18}
                  className={`shrink-0 mt-0.5 ${
                    targetStatus === 'ACTIVE' ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-gray-900">Active</div>
                  <div className="text-[11px] text-gray-500">Allow activations</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus('SUSPENDED')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  targetStatus === 'SUSPENDED'
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <PauseCircle
                  size={18}
                  className={`shrink-0 mt-0.5 ${
                    targetStatus === 'SUSPENDED' ? 'text-amber-600' : 'text-gray-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-gray-900">Suspended</div>
                  <div className="text-[11px] text-gray-500">Temporarily pause</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Audit Reason / Notes
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Lab maintenance, subscription billing audit, etc."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c] resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={updateStatusMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStatusMutation.isPending || isCurrentStatus}
              className={`px-5 py-2 text-sm font-medium text-white rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                targetStatus === 'SUSPENDED'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {updateStatusMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              <span>Apply Status</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

