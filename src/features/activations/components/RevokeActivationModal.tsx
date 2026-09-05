import React, { useState, useEffect } from 'react';
import { X, AlertOctagon, ShieldAlert, Monitor, Loader2 } from 'lucide-react';
import { useRevokeActivation } from '../api/activationApi';
import type { Activation } from '../api/activationApi';

interface RevokeActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activation: Activation | null;
}

export const RevokeActivationModal: React.FC<RevokeActivationModalProps> = ({
  isOpen,
  onClose,
  activation,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const revokeMutation = useRevokeActivation();

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !revokeMutation.isPending) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, revokeMutation.isPending]);

  if (!isOpen || !activation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    revokeMutation.mutate(
      {
        id: activation.id,
        data: { reason: reason.trim() },
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
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
              <AlertOctagon size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                Revoke Workstation Terminal
              </h3>
              <p className="text-xs text-red-600 font-medium mt-0.5">
                Permanent Hardware Terminal Blacklist
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={revokeMutation.isPending}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600">
              <Monitor size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">{activation.deviceName}</div>
              <div className="text-[11px] font-mono text-gray-400 select-all">
                ID: {activation.deviceId}
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900 leading-relaxed">
            <ShieldAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Irreversible Revocation:</strong> Revoking this workstation permanently prevents this physical computer from running typing tests or authenticating under any license on this platform.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Revocation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Unauthorized hardware relocation, suspected test cheating machine, or security breach..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Recorded in immutable compliance security audit trail.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={revokeMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={revokeMutation.isPending || !reason.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {revokeMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              <span>Revoke Terminal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

