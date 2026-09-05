import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  AlertTriangle,
  Calendar,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useCleanupAuditLogs } from '../api/auditApi';
import { toast } from 'sonner';

interface AuditCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditCleanupModal: React.FC<AuditCleanupModalProps> = ({ isOpen, onClose }) => {
  const cleanupMutation = useCleanupAuditLogs();
  const [retentionDays, setRetentionDays] = useState(90);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setRetentionDays(90);
      setConfirmText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCleanup = (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmText !== 'PRUNE') {
      toast.error('Please type PRUNE to confirm audit log purge');
      return;
    }

    cleanupMutation.mutate(
      { retentionDays },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Regulatory Audit Log Pruning</h2>
              <p className="text-xs text-gray-500">
                Purge historical audit records meeting retention compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCleanup} className="p-6 space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Compliance Notice:</strong> Ensure your regulatory jurisdiction permits purging audit logs older than the chosen retention period. This action is irreversible.
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-500" />
                Retention Threshold (Days)
              </label>
              <span className="text-xs font-bold text-gray-900 font-mono">
                {retentionDays} days
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={730}
              step={1}
              value={retentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value, 10) || 90)}
              className="w-full accent-[#ff8a5c] h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
              <span>30 days (Min)</span>
              <span>90 days (Recommended)</span>
              <span>730 days (2 Years)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
            Audit logs generated before{' '}
            <strong className="text-gray-900">
              {new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </strong>{' '}
            will be permanently removed.
          </div>

          {/* Type Confirmation */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Type <strong className="text-rose-600">PRUNE</strong> to confirm:
            </label>
            <input
              type="text"
              required
              placeholder="PRUNE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={cleanupMutation.isPending || confirmText !== 'PRUNE'}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {cleanupMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Pruning Audit Logs...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Confirm Prune
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

