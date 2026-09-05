import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, PauseCircle, Loader2 } from 'lucide-react';
import { useUpdateInstitutionStatus } from '../api/institutionApi';
import type { Institution } from '../api/institutionApi';

interface InstitutionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution | null;
}

export const InstitutionStatusModal: React.FC<InstitutionStatusModalProps> = ({
  isOpen,
  onClose,
  institution,
}) => {
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (institution) {
      // Default to toggling opposite
      setTargetStatus(institution.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
      setReason('');
    }
  }, [institution]);

  const updateStatusMutation = useUpdateInstitutionStatus();

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

  if (!isOpen || !institution) return null;

  const isCurrentStatus = institution.status === targetStatus;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentStatus) return;

    updateStatusMutation.mutate(
      {
        id: institution.id,
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
                targetStatus === 'SUSPENDED'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {targetStatus === 'SUSPENDED' ? <PauseCircle size={22} /> : <CheckCircle2 size={22} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                Change Operational Status
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Current status:{' '}
                <span
                  className={`font-semibold ${
                    institution.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {institution.status}
                </span>
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
                  <div className="text-[11px] text-gray-500">Unrestricted logins & tests</div>
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
                  <div className="text-[11px] text-gray-500">Block logins & activations</div>
                </div>
              </button>
            </div>
          </div>

          {targetStatus === 'SUSPENDED' && (
            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl flex items-start gap-2 text-xs text-amber-900">
              <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                Suspending an institution blocks student desktop authentications and disables license activations across all labs.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Audit Reason / Internal Notes
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Center subscription renewal pending, or license limit renegotiation..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c] resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Recorded in immutable security audit logs for compliance tracking.
            </p>
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
