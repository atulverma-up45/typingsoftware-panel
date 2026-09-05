import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Package,
  CheckCircle2,
  Archive,
  FileEdit,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useUpdateReleaseStatus } from '../api/releaseApi';
import type { Release, ReleaseStatus } from '../api/releaseApi';

interface ReleaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: Release | null;
}

export const ReleaseStatusModal: React.FC<ReleaseStatusModalProps> = ({
  isOpen,
  onClose,
  release,
}) => {
  const updateStatusMutation = useUpdateReleaseStatus();

  const [status, setStatus] = useState<ReleaseStatus>('DRAFT');
  const [reason, setReason] = useState('');

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
    if (release && isOpen) {
      setStatus(release.status);
      setReason('');
    }
  }, [release, isOpen]);

  if (!isOpen || !release) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateStatusMutation.mutate(
      {
        id: release.id,
        data: {
          status,
          reason: reason.trim() || undefined,
        },
      },
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
            <div className="w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center">
              <RefreshCw size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Update Status (v{release.version})
              </h2>
              <p className="text-xs text-gray-500">
                Transition release deployment state across the fleet
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-2">
              Select Lifecycle Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'PUBLISHED' as ReleaseStatus, label: 'Published', icon: CheckCircle2, color: 'text-emerald-600' },
                { id: 'DRAFT' as ReleaseStatus, label: 'Draft', icon: FileEdit, color: 'text-amber-600' },
                { id: 'ARCHIVED' as ReleaseStatus, label: 'Archived', icon: Archive, color: 'text-gray-600' },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatus(opt.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-[#ff8a5c] bg-[#fff0eb]/50 text-gray-900 shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} className={`mb-1.5 ${opt.color}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {status === 'PUBLISHED' && release.status !== 'PUBLISHED' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Publishing this release will make it immediately discoverable by desktop clients on the{' '}
                <strong className="capitalize font-bold">{release.channel}</strong> channel.
              </span>
            </div>
          )}

          {status === 'ARCHIVED' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                Archiving this release prevents desktop clients from discovering it during auto-update checks.
              </span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Audit Justification / Note (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Critical security hotfix deployed to all production endpoints"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c]"
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
              disabled={updateStatusMutation.isPending || status === release.status}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Status'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

