import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import {
  useUpdateInstitution,
  useCheckSlug,
} from '../api/institutionApi';
import type {
  Institution,
  UpdateInstitutionInput,
} from '../api/institutionApi';

interface EditInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution | null;
}

export const EditInstitutionModal: React.FC<EditInstitutionModalProps> = ({
  isOpen,
  onClose,
  institution,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');

  // Populate form with current institution details
  useEffect(() => {
    if (institution) {
      setName(institution.name || '');
      setSlug(institution.slug || '');
      setEmail(institution.email || '');
      setPhone(institution.phone || '');
      setAddress(institution.address || '');
      setStatus(institution.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE');
    }
  }, [institution]);

  // Debounced slug check only if changed from original slug
  const [debouncedSlug, setDebouncedSlug] = useState('');
  const isSlugChanged = Boolean(institution && slug.trim().toLowerCase() !== institution.slug.toLowerCase());

  useEffect(() => {
    if (!isSlugChanged) {
      setDebouncedSlug('');
      return;
    }
    const handler = setTimeout(() => {
      setDebouncedSlug(slug.trim().toLowerCase());
    }, 350);
    return () => clearTimeout(handler);
  }, [slug, isSlugChanged]);

  const { data: slugCheck, isFetching: isCheckingSlug } = useCheckSlug(
    debouncedSlug,
    Boolean(isSlugChanged && debouncedSlug.length >= 2),
  );

  const updateMutation = useUpdateInstitution();

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

  if (!isOpen || !institution) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;
    if (!slug.trim()) return;
    if (!email.trim()) return;

    const payload: UpdateInstitutionInput = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      status,
    };

    updateMutation.mutate(
      { id: institution.id, data: payload },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  const isSlugValid = /^[a-z0-9-]+$/.test(slug) && slug.length >= 2;
  const isSlugConflict = isSlugChanged && slugCheck && !slugCheck.available;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Edit3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                Edit Institution Profile
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Update identity, slug, communication channels, and status for{' '}
                <span className="font-semibold text-gray-700">{institution.name}</span>
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
          {/* Institution Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Institution Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Building2 size={16} />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Typing Academy"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
              />
            </div>
          </div>

          {/* Slug Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Tenant Slug <span className="text-red-500">*</span>
              </label>
              {isSlugChanged && (
                <span className="text-[11px] text-amber-600 font-medium">
                  Changing slug updates all client login URLs!
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-mono text-sm">
                @
              </div>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                className={`w-full pl-8 pr-28 py-2 text-sm font-mono border rounded-xl focus:outline-none focus:ring-2 ${
                  isSlugConflict
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                    : isSlugChanged && slugCheck?.available
                    ? 'border-emerald-300 focus:ring-emerald-200 focus:border-emerald-500'
                    : 'border-gray-200 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {isSlugChanged ? (
                  isCheckingSlug ? (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Loader2 size={13} className="animate-spin" />
                      <span>Checking</span>
                    </div>
                  ) : slug && isSlugConflict ? (
                    <div className="flex items-center gap-1 text-[11px] text-red-600 font-medium">
                      <AlertCircle size={13} />
                      <span>Taken</span>
                    </div>
                  ) : slugCheck?.available ? (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                      <CheckCircle2 size={13} />
                      <span>Available</span>
                    </div>
                  ) : null
                ) : (
                  <span className="text-[11px] text-gray-400 font-mono">Current</span>
                )}
              </div>
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Official Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Campus Address
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 pointer-events-none text-gray-400">
                <MapPin size={16} />
              </div>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Campus address, city, state"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c] resize-none"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Operational Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="edit-status"
                  value="ACTIVE"
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className="text-[#ff8a5c] focus:ring-[#ff8a5c]"
                />
                <span className="font-medium text-gray-800">Active</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="edit-status"
                  value="SUSPENDED"
                  checked={status === 'SUSPENDED'}
                  onChange={() => setStatus('SUSPENDED')}
                  className="text-[#ff8a5c] focus:ring-[#ff8a5c]"
                />
                <span className="font-medium text-gray-800">Suspended</span>
              </label>
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
              disabled={updateMutation.isPending || isSlugConflict || !isSlugValid}
              className="px-5 py-2 text-sm font-medium text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
