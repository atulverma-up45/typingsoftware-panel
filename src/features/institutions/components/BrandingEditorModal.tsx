import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Sparkles,
  RotateCcw,
  Hammer,
  Loader2,
  Building2,
  Mail,
  Phone,
  Globe,
  FileSignature,
  Award,
  Check,
} from 'lucide-react';
import {
  useInstitutionBranding,
  useUpdateBranding,
  useResetBranding,
  useTriggerBrandingBuild,
} from '../api/institutionApi';
import type {
  Institution,
  UpdateBrandingInput,
} from '../api/institutionApi';

interface BrandingEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution | null;
}

const PRESET_PALETTES = [
  { name: 'Corporate Blue', primary: '#2563EB', secondary: '#1E40AF', accent: '#06B6D4' },
  { name: 'Emerald Forest', primary: '#059669', secondary: '#065F46', accent: '#10B981' },
  { name: 'Royal Violet', primary: '#7C3AED', secondary: '#5B21B6', accent: '#A78BFA' },
  { name: 'Warm Coral', primary: '#EA580C', secondary: '#9A3412', accent: '#FB923C' },
  { name: 'Crimson Slate', primary: '#E11D48', secondary: '#9F1239', accent: '#F43F5E' },
  { name: 'Midnight Charcoal', primary: '#334155', secondary: '#0F172A', accent: '#38BDF8' },
];

export const BrandingEditorModal: React.FC<BrandingEditorModalProps> = ({
  isOpen,
  onClose,
  institution,
}) => {
  const institutionId = institution?.id;
  const { data: branding, isLoading: isLoadingBranding } = useInstitutionBranding(institutionId);

  // Form states
  const [applicationName, setApplicationName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF');
  const [accentColor, setAccentColor] = useState('#06B6D4');
  const [tagline, setTagline] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryDesignation, setSignatoryDesignation] = useState('');
  const [developerCredit, setDeveloperCredit] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Populate when data arrives
  useEffect(() => {
    if (branding) {
      setApplicationName(branding.applicationName || '');
      setDisplayName(branding.displayName || '');
      setPrimaryColor(branding.primaryColor || '#2563EB');
      setSecondaryColor(branding.secondaryColor || '#1E40AF');
      setAccentColor(branding.accentColor || '#06B6D4');
      setTagline(branding.tagline || '');
      setRegistrationNumber(branding.registrationNumber || '');
      setSignatoryName(branding.signatoryName || '');
      setSignatoryDesignation(branding.signatoryDesignation || '');
      setDeveloperCredit(branding.developerCredit || '');
      setSupportEmail(branding.supportEmail || '');
      setSupportPhone(branding.supportPhone || '');
      setWebsite(branding.website || '');
    } else if (institution) {
      setApplicationName(`${institution.name} Typing Master`);
      setDisplayName(institution.name);
      setSupportEmail(institution.email || '');
      setSupportPhone(institution.phone || '');
    }
  }, [branding, institution]);

  const updateBrandingMutation = useUpdateBranding();
  const resetBrandingMutation = useResetBranding();
  const triggerBuildMutation = useTriggerBrandingBuild();

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !updateBrandingMutation.isPending && !triggerBuildMutation.isPending) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, updateBrandingMutation.isPending, triggerBuildMutation.isPending]);

  if (!isOpen || !institution) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpdateBrandingInput = {
      applicationName: applicationName.trim() || undefined,
      displayName: displayName.trim() || undefined,
      primaryColor,
      secondaryColor,
      accentColor,
      tagline: tagline.trim() || undefined,
      registrationNumber: registrationNumber.trim() || undefined,
      signatoryName: signatoryName.trim() || undefined,
      signatoryDesignation: signatoryDesignation.trim() || undefined,
      developerCredit: developerCredit.trim() || undefined,
      supportEmail: supportEmail.trim() || undefined,
      supportPhone: supportPhone.trim() || undefined,
      website: website.trim() || undefined,
    };

    updateBrandingMutation.mutate({
      institutionId: institution.id,
      data: payload,
    });
  };

  const handleReset = () => {
    if (window.confirm('Reset this institution branding back to system default theme?')) {
      resetBrandingMutation.mutate({
        institutionId: institution.id,
        data: { preserveContactInfo: true },
      });
    }
  };

  const handleTriggerBuild = () => {
    triggerBuildMutation.mutate(institution.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
              <Palette size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                  White-Label Branding Suite
                </h2>
                {branding && (
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-violet-100 text-violet-700 rounded-full font-semibold">
                    v{branding.version}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Customize client executable theming, certificate credentials, and generate custom builds for{' '}
                <span className="font-semibold text-gray-700">{institution.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={updateBrandingMutation.isPending || triggerBuildMutation.isPending}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body: Split View (Customizer on left, Live Client Preview on right) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row">
          {/* Left Form Column */}
          <form id="branding-form" onSubmit={handleSave} className="flex-1 p-6 space-y-5">
            {isLoadingBranding ? (
              <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Loading branding profile...</span>
              </div>
            ) : (
              <>
                {/* Preset Palettes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Theme Color Palettes
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_PALETTES.map((palette) => (
                      <button
                        type="button"
                        key={palette.name}
                        onClick={() => {
                          setPrimaryColor(palette.primary);
                          setSecondaryColor(palette.secondary);
                          setAccentColor(palette.accent);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                          primaryColor.toLowerCase() === palette.primary.toLowerCase()
                            ? 'border-violet-500 bg-violet-50/40 ring-2 ring-violet-500/20'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <div
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: palette.primary }}
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: palette.secondary }}
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: palette.accent }}
                            />
                          </div>
                          {primaryColor.toLowerCase() === palette.primary.toLowerCase() && (
                            <Check size={12} className="text-violet-600" />
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-gray-700 truncate">
                          {palette.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Primary Brand
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
                        className="w-full text-xs font-mono uppercase px-2.5 py-1.5 border border-gray-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Secondary Shade
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
                        className="w-full text-xs font-mono uppercase px-2.5 py-1.5 border border-gray-200 rounded-xl"
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
                        className="w-full text-xs font-mono uppercase px-2.5 py-1.5 border border-gray-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Application Name & Display Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Software Window Title
                    </label>
                    <input
                      type="text"
                      value={applicationName}
                      onChange={(e) => setApplicationName(e.target.value)}
                      placeholder="e.g. Apex Typing Master"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Center Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Apex Institute of IT"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Tagline & Registration */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Header Tagline / Mission
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Govt / ISO Registration Number
                    </label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="ISO 9001:2015 & Reg: UP/LKO/2024/0981"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Signatory & Developer Credit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Signatory Authority Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FileSignature size={15} />
                      </div>
                      <input
                        type="text"
                        value={signatoryName}
                        onChange={(e) => setSignatoryName(e.target.value)}
                        placeholder="Dr. R. K. Sharma"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
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
                      placeholder="Managing Director & Controller"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Developer Credit */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Certificate Developer Credit
                  </label>
                  <input
                    type="text"
                    value={developerCredit}
                    onChange={(e) => setDeveloperCredit(e.target.value)}
                    placeholder="Powered by Typing Expert Engine"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  />
                </div>

                {/* Support Contact & Website */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Support Phone
                    </label>
                    <input
                      type="tel"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                    />
                  </div>
                </div>
              </>
            )}
          </form>

          {/* Right Live Preview Column */}
          <div className="w-full lg:w-[360px] bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 p-6 flex flex-col justify-between shrink-0 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-violet-600" />
                  Live Client Mockup
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Real-time</span>
              </div>

              {/* Desktop App Window Mockup */}
              <div className="rounded-xl overflow-hidden shadow-lg border border-gray-300 bg-white">
                {/* Title bar */}
                <div
                  className="px-3 py-2 text-white flex items-center justify-between"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                    <span className="text-xs font-bold truncate">
                      {applicationName || 'Typing Master'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                    <div className="w-2 h-2 rounded-full bg-white/80" />
                  </div>
                </div>

                {/* Subheader */}
                <div
                  className="px-3 py-1.5 text-white/90 text-[10px] flex items-center justify-between"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <span className="truncate">{displayName || institution.name}</span>
                  <span
                    className="px-1.5 py-0.2 text-[9px] font-mono rounded"
                    style={{ backgroundColor: accentColor, color: '#000' }}
                  >
                    CERTIFIED
                  </span>
                </div>

                {/* Window Body */}
                <div className="p-3.5 space-y-3">
                  <p className="text-[10px] text-gray-500 leading-tight">
                    {tagline || 'Govt Recognized Computer Training & Skill Development Center'}
                  </p>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center space-y-1">
                    <div className="text-[11px] font-semibold text-gray-800">
                      Standard English Speed Test
                    </div>
                    <div className="text-[10px] text-gray-400">Duration: 10 mins • Backspace: Allowed</div>
                    <button
                      type="button"
                      className="mt-1 w-full py-1 text-xs text-white font-medium rounded-md shadow-xs transition-opacity"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Start Test
                    </button>
                  </div>

                  {/* Certificate Footer Mock */}
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-500">
                    <div>
                      <div className="font-semibold text-gray-700">
                        {signatoryName || 'Authorized Signatory'}
                      </div>
                      <div className="text-[8px] text-gray-400">
                        {signatoryDesignation || 'Director of Examinations'}
                      </div>
                    </div>
                    <Award size={18} style={{ color: accentColor }} />
                  </div>
                  {registrationNumber && (
                    <div className="text-[8px] text-center text-gray-400 font-mono">
                      {registrationNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* White-Label Compile Card */}
              <div className="mt-5 p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <Hammer size={16} className="text-violet-600" />
                  <span>Desktop Executable Builder</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Trigger an automated cloud compilation pipeline to generate a tailored Windows installer (.exe) stamped with this institution's branding and slug.
                </p>
                <button
                  type="button"
                  onClick={handleTriggerBuild}
                  disabled={triggerBuildMutation.isPending || updateBrandingMutation.isPending}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {triggerBuildMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Compiling Client...</span>
                    </>
                  ) : (
                    <>
                      <Hammer size={14} />
                      <span>Compile Branded App (.exe)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Reset to defaults button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleReset}
                disabled={resetBrandingMutation.isPending}
                className="w-full py-2 px-3 text-xs font-medium text-gray-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-gray-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {resetBrandingMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RotateCcw size={13} />
                )}
                <span>Reset Theme to Defaults</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={updateBrandingMutation.isPending || triggerBuildMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="branding-form"
            disabled={updateBrandingMutation.isPending || triggerBuildMutation.isPending}
            className="px-5 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {updateBrandingMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            <span>Save Branding Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
