import React, { useState } from 'react';
import { ShieldAlert, AlertOctagon, Loader2, Key } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useRevokeLicense } from '../api/licenseApi';
import type { License } from '../api/licenseApi';

interface RevokeLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: License | null;
}

export const RevokeLicenseModal: React.FC<RevokeLicenseModalProps> = ({
  isOpen,
  onClose,
  license,
}) => {
  const [reason, setReason] = useState('');

  // Reset the reason on every open — render-phase state adjustment (pattern used
  // by ConfirmDialog). Doing this in an effect costs an extra commit and can
  // briefly paint the previous target's reason.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setReason('');
  }

  const revokeMutation = useRevokeLicense();

  if (!isOpen || !license) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    revokeMutation.mutate(
      {
        id: license.id,
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
    <Modal
      isOpen={isOpen && !!license}
      onClose={onClose}
      size="md"
      title="Revoke License Key"
      description="Immediate Hardware Deactivation"
      icon={<AlertOctagon size={22} />}
      accentClassName="bg-red-50 text-red-600 border-red-100"
      closeOnBackdrop={!revokeMutation.isPending}
      closeOnEscape={!revokeMutation.isPending}
      showCloseButton={!revokeMutation.isPending}
      bodyClassName="p-6"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={revokeMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="revoke-license-form"
            disabled={revokeMutation.isPending || !reason.trim()}
            className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {revokeMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            <span>Revoke Key Now</span>
          </button>
        </>
      }
    >
      <form id="revoke-license-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-xs">
          <Key size={14} className="text-gray-400" />
          <span className="font-mono font-bold text-gray-800 select-all">
            {license.licenseKey}
          </span>
        </div>

        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900 leading-relaxed">
          <ShieldAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Permanent Terminal Invalidation:</strong> All{' '}
            <span className="font-bold underline">
              {license.activations?.length || 0} active lab workstations
            </span>{' '}
            running this key will be disconnected immediately upon their next background verification.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Revocation Justification Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Contract terminated, security breach detected, or key compromised..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-none"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Recorded in immutable compliance audit trail.
          </p>
        </div>
      </form>
    </Modal>
  );
};
