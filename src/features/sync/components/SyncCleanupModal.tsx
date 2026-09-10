import React, { useState } from 'react';
import { Trash2, AlertTriangle, Calendar, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCleanupSyncHistory } from '../api/syncApi';

interface SyncCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncCleanupModal: React.FC<SyncCleanupModalProps> = ({ isOpen, onClose }) => {
  const cleanupMutation = useCleanupSyncHistory();
  const [retentionDays, setRetentionDays] = useState(30);
  // Captured once per mount (the parent unmounts this modal when closed), so
  // the informational cutoff label never calls impure Date.now() during render.
  const [mountedAt] = useState(() => Date.now());

  if (!isOpen) return null;

  const cutoffDate = new Date(mountedAt - retentionDays * 24 * 60 * 60 * 1000).toLocaleDateString();

  const handleCleanup = (e: React.FormEvent) => {
    e.preventDefault();
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
      title="Prune Stale Sync History"
      description="Purge processed idempotency records older than retention threshold"
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
            form="sync-cleanup-form"
            disabled={cleanupMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {cleanupMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Purging Records...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Purge Stale Records
              </>
            )}
          </button>
        </>
      }
    >
      <form id="sync-cleanup-form" onSubmit={handleCleanup} className="p-6 pt-4 space-y-4">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            This action removes historical operational records older than the selected retention
            period. It does <strong>not</strong> delete registered workstations, licenses, or content.
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
            min={7}
            max={365}
            step={1}
            value={retentionDays}
            onChange={(e) => setRetentionDays(parseInt(e.target.value, 10) || 30)}
            className="w-full accent-primary h-2 bg-gray-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
            <span>7 days (Min)</span>
            <span>30 days (Recommended)</span>
            <span>365 days (Max)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
          Records processed prior to{' '}
          <strong className="text-gray-900">{cutoffDate}</strong>{' '}
          will be permanently purged from the database.
        </div>
      </form>
    </Modal>
  );
};

