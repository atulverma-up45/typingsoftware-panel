import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Palette,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileSignature,
} from 'lucide-react';
import { useCreateInstitution, useCheckSlug } from '../api/institutionApi';
import type { CreateInstitutionInput } from '../api/institutionApi';

interface CreateInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PALETTES = [
  { name: 'Corporate Blue', primary: '#2563EB', secondary: '#1E40AF', accent: '#06B6D4' },
  { name: 'Emerald Forest', primary: '#059669', secondary: '#065F46', accent: '#10B981' },
  { name: 'Royal Violet', primary: '#7C3AED', secondary: '#5B21B6', accent: '#A78BFA' },
  { name: 'Warm Coral', primary: '#EA580C', secondary: '#9A3412', accent: '#FB923C' },
  { name: 'Crimson Slate', primary: '#E11D48', secondary: '#9F1239', accent: '#F43F5E' },
];

export const CreateInstitutionModal: React.FC<CreateInstitutionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'branding'>('profile');

  // Basic Info State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');

  // Branding State
  const [applicationName, setApplicationName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF');
  const [accentColor, setAccentColor] = useState('#06B6D4');
  const [tagline, setTagline] = useState('Govt Recognized Computer Training & Skill Development Center');
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryDesignation, setSignatoryDesignation] = useState('');
  const [website, setWebsite] = useState('');

  // Debounced slug check
  const [debouncedSlug, setDebouncedSlug] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSlug(slug.trim().toLowerCase());
    }, 350);
    return () => clearTimeout(handler);
  }, [slug]);

  const { data: slugCheck, isFetching: isCheckingSlug } = useCheckSlug(
    debouncedSlug,
    debouncedSlug.length >= 2,
  );

  const createMutation = useCreateInstitution();

  // Auto-slug generator when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
    if (!displayName) {
      setDisplayName(val);
    }
    if (!applicationName) {
      setApplicationName(val ? `${val} Typing Master` : '');
    }
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !createMutation.isPending) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, createMutation.isPending]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;
    if (!slug.trim()) return;
    if (!email.trim()) return;

    const payload: CreateInstitutionInput = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      status,
      branding: {
        applicationName: applicationName.trim() || `${name.trim()} Typing Master`,
        displayName: displayName.trim() || name.trim(),
        primaryColor,
        secondaryColor,
        accentColor,
        tagline: tagline.trim() || undefined,
        signatoryName: signatoryName.trim() || undefined,
        signatoryDesignation: signatoryDesignation.trim() || undefined,
        website: website.trim() || undefined,
      },
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const isSlugValid = /^[a-z0-9-]+$/.test(slug) && slug.length >= 2;
  const isSlugConflict = slugCheck && !slugCheck.available;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#fff0eb] text-[#ff8a5c] rounded-xl">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                Provision New Institution
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Onboard a client center, configure unique tenant slug, and set brand styling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={createMutation.isPending}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building2 size={14} />
            1. Center Identity & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'branding'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Palette size={14} />
            2. White-Label Branding & Palette
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {activeTab === 'profile' ? (
            <div className="space-y-4">
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
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Apex Typing Academy"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                  />
                </div>
              </div>

              {/* Slug Input with Live Validation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Unique Tenant Slug <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Used for dedicated client logins and API routing
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-mono text-sm">
                    @
                  </div>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setIsSlugManuallyEdited(true);
                      setSlug(e.target.value.toLowerCase().trim());
                    }}
                    placeholder="apex-typing-academy"
                    className={`w-full pl-8 pr-28 py-2 text-sm font-mono border rounded-xl focus:outline-none focus:ring-2 ${
                      isSlugConflict
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : slugCheck?.available
                        ? 'border-emerald-300 focus:ring-emerald-200 focus:border-emerald-500'
                        : 'border-gray-200 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]'
                    }`}
                  />
                  {/* Status Indicator Badge */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isCheckingSlug ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Loader2 size={13} className="animate-spin" />
                        <span>Checking</span>
                      </div>
                    ) : slug && !isSlugValid ? (
                      <span className="text-[11px] text-amber-600 font-medium">Invalid chars</span>
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
                    ) : null}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Only lowercase letters, numbers, and hyphens (min 2 characters).
                </p>
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Primary Contact Email <span className="text-red-500">*</span>
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
                      placeholder="admin@apexinstitute.com"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone / Mobile Number
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

              {/* Physical Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Campus / Physical Address
                </label>
                <div className="relative">
                  <div className="absolute top-2.5 left-3 pointer-events-none text-gray-400">
                    <MapPin size={16} />
                  </div>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Suite 402, EduTech Tower, Central Market, Lucknow, UP"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c] resize-none"
                  />
                </div>
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Initial Operational Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="ACTIVE"
                      checked={status === 'ACTIVE'}
                      onChange={() => setStatus('ACTIVE')}
                      className="text-[#ff8a5c] focus:ring-[#ff8a5c]"
                    />
                    <span className="font-medium text-gray-800">Active</span>
                    <span className="text-xs text-gray-400">(Ready for licensing and logins)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="SUSPENDED"
                      checked={status === 'SUSPENDED'}
                      onChange={() => setStatus('SUSPENDED')}
                      className="text-[#ff8a5c] focus:ring-[#ff8a5c]"
                    />
                    <span className="font-medium text-gray-800">Suspended</span>
                    <span className="text-xs text-gray-400">(Access blocked pending setup)</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Branding Header info */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-start gap-2.5 text-blue-900 text-xs leading-relaxed">
                <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">White-Label Customization:</strong> Configure the visual identity for the client desktop app, certificate headers, and student login screens.
                </div>
              </div>

              {/* Preset Color Palettes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Quick Color Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PRESET_PALETTES.map((palette) => (
                    <button
                      type="button"
                      key={palette.name}
                      onClick={() => {
                        setPrimaryColor(palette.primary);
                        setSecondaryColor(palette.secondary);
                        setAccentColor(palette.accent);
                      }}
                      className="p-2 border border-gray-200 rounded-xl text-left hover:border-[#ff8a5c] transition-all bg-white flex flex-col gap-1.5"
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.primary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.secondary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.accent }} />
                      </div>
                      <span className="text-[10px] font-medium text-gray-700 truncate">
                        {palette.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Hex Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full text-xs font-mono uppercase px-2.5 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Secondary Accent
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full text-xs font-mono uppercase px-2.5 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Highlight Accent
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full text-xs font-mono uppercase px-2.5 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Application Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Software App Title
                  </label>
                  <input
                    type="text"
                    value={applicationName}
                    onChange={(e) => setApplicationName(e.target.value)}
                    placeholder="e.g. Apex Typing Master"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Institution Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Apex Institute of IT"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tagline / Header Description
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Govt Recognized Computer Training & Skill Development Center"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                />
              </div>

              {/* Signatory Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Signatory Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FileSignature size={16} />
                    </div>
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      placeholder="Dr. R. K. Sharma"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Signatory Designation
                  </label>
                  <input
                    type="text"
                    value={signatoryDesignation}
                    onChange={(e) => setSignatoryDesignation(e.target.value)}
                    placeholder="Managing Director & Controller of Exams"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Official Website
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Globe size={16} />
                  </div>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://apexinstitute.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                  />
                </div>
              </div>

              {/* Live Mini Preview Box */}
              <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2">
                <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                  Desktop App Preview
                </span>
                <div
                  className="p-4 rounded-lg text-white shadow-sm transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm leading-tight">
                        {applicationName || 'Typing Master Pro'}
                      </h4>
                      <p className="text-[11px] opacity-85">{displayName || name || 'Institute Name'}</p>
                    </div>
                    <span
                      className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-white/20 backdrop-blur-sm"
                      style={{ border: `1px solid ${accentColor}` }}
                    >
                      v1.0 Branded
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] opacity-75 truncate">{tagline}</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            {activeTab === 'profile' ? (
              <button
                type="button"
                onClick={() => setActiveTab('branding')}
                className="text-xs font-semibold text-[#ff8a5c] hover:underline flex items-center gap-1"
              >
                Customize Branding & Palette &rarr;
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1"
              >
                &larr; Back to Profile
              </button>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || isSlugConflict || !isSlugValid}
                className="px-5 py-2 text-sm font-medium text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                <span>Provision Center</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
