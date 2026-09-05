import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Monitor,
  Clock,
  Calendar,
  Loader2,
  Key,
  Shield,
} from 'lucide-react';
import { useUpdateLicense } from '../api/licenseApi';
import type { License, UpdateLicenseInput } from '../api/licenseApi';

interface EditLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: License | null;
}

export const EditLicenseModal: React.FC<EditLicenseModalProps> = ({
  isOpen,
  onClose,
  license,
}) => {
  const [maxActivations, setMaxActivations] = useState<number>(5);
  const [offlineGraceDays, setOfflineGraceDays] = useState<number>(14);
  const [expiresAt, setExpiresAt] = useState<string>('');

  useEffect(() => {
    if (license) {
      setMaxActivations(license.maxActivations || 5);
      setOfflineGraceDays(license.offlineGraceDays || 14);
      if (license.expiresAt) {
        // Format ISO date to YYYY-MM-DD for date input
        const d = new Date(license.expiresAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setExpiresAt(`${yyyy}-${mm}-${dd}`);
      } else {
        setExpiresAt('');
      }
    }
  }, [license]);

  const updateMutation = useUpdateLicense();

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !updateMutation.isPending) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, updateMutation.isPending]);

  if (!isOpen || !license) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpdateLicenseInput = {
      maxActivations: Number(maxActivations),
      offlineGraceDays: Number(offlineGraceDays),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    };

    updateMutation.mutate(
      { id: license.id, data: payload },
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
      <div className="relative w-full max-w-lg bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Edit2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                Edit License Configuration
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Update seat allocation limits and validity for{' '}
                <span className="font-mono font-bold text-gray-700">{license.licenseKey}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Summary Badge */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-gray-400" />
              <span className="font-mono font-bold text-gray-800">{license.licenseKey}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              {license.status}
            </span>
          </div>

          {/* Seat Capacity */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Max Workstation Seats <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Monitor size={16} />
              </div>
              <input
                type="number"
                required
                min={1}
                max={500}
                value={maxActivations}
                onChange={(e) => setMaxActivations(parseInt(e.target.value) || 1)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Currently connected:{' '}
              <span className="font-semibold text-gray-700">
                {license.activations?.length || 0} active terminals
              </span>
            </p>
          </div>

          {/* Offline Grace Days */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Offline Grace Period (Days)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Clock size={16} />
              </div>
              <input
                type="number"
                required
                min={1}
                max={60}
                value={offlineGraceDays}
                onChange={(e) => setOfflineGraceDays(parseInt(e.target.value) || 14)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Max days desktop machines can continue typing without an internet heartbeat check
            </p>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              License Expiration Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Calendar size={16} />
              </div>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

