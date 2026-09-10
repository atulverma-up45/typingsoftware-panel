import React, { useState } from 'react';
import { Trash2, AlertTriangle, Calendar, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
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
  // Captured once per mount (the parent unmounts this modal when closed), so
  // the informational cutoff label never calls impure Date.now() during render.
  const [mountedAt] = useState(() => Date.now());

  if (!isOpen) return null;

  const cutoffDate = new Date(mountedAt - retentionDays * 24 * 60 * 60 * 1000).toLocaleDateString();

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
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title="Regulatory Audit Log Pruning"
      description="Purge historical audit records meeting retention compliance"
      icon={<Trash2 size={20} strokeWidth={2.2} />}
      accentClassName="bg-rose-50 text-rose-600 border-rose-100"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="audit-cleanup-form"
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
        </>
      }
    >
      <form id="audit-cleanup-form" onSubmit={handleCleanup} className="p-6 pt-4 space-y-4">
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
            className="w-full accent-primary h-2 bg-gray-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
            <span>30 days (Min)</span>
            <span>90 days (Recommended)</span>
            <span>730 days (2 Years)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
          Audit logs generated before{' '}
          <strong className="text-gray-900">{cutoffDate}</strong>{' '}
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
      </form>
    </Modal>
  );
};


