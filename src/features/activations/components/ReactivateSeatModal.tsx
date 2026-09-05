import React, { useState, useEffect } from 'react';
import { X, PlayCircle, Monitor, Loader2, CheckCircle2 } from 'lucide-react';
import { useReactivateActivation } from '../api/activationApi';
import type { Activation } from '../api/activationApi';

interface ReactivateSeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activation: Activation | null;
}

export const ReactivateSeatModal: React.FC<ReactivateSeatModalProps> = ({
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

  const reactivateMutation = useReactivateActivation();

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !reactivateMutation.isPending) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, reactivateMutation.isPending]);

  if (!isOpen || !activation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    reactivateMutation.mutate(
      {
        id: activation.id,
        data: { reason: reason.trim() || undefined },
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
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <PlayCircle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                Reactivate Workstation Seat
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Re-bind lab PC to an available license slot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={reactivateMutation.isPending}
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

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-900 leading-relaxed">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Capacity Verification:</strong> The platform will automatically verify that license <span className="font-mono font-semibold">{activation.license?.licenseKey || activation.licenseId}</span> has an available seat before completing reactivation.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Reactivation Reason (Optional)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Returned from hardware repair, lab reopened for tests..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={reactivateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reactivateMutation.isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {reactivateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              <span>Reactivate Seat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

