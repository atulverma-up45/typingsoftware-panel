import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Palette,
  BarChart3,
  Copy,
  Check,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileSignature,
  Award,
  Users,
  Monitor,
  Shield,
  BrainCircuit,
  DollarSign,
  Loader2,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import {
  useInstitutionStats,
  useInstitutionBranding,
} from '../api/institutionApi';
import type { Institution } from '../api/institutionApi';
import { toast } from 'sonner';

interface InstitutionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution | null;
  onOpenEdit?: (inst: Institution) => void;
  onOpenBranding?: (inst: Institution) => void;
}

export const InstitutionDetailModal: React.FC<InstitutionDetailModalProps> = ({
  isOpen,
  onClose,
  institution,
  onOpenEdit,
  onOpenBranding,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'metrics'>('profile');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const institutionId = institution?.id;

  // Fetch operational metrics for Tab 3
  const { data: stats, isLoading: isLoadingStats } = useInstitutionStats(
    activeTab === 'metrics' ? institutionId : undefined,
  );

  // Fetch branding for Tab 2
  const { data: branding, isLoading: isLoadingBranding } = useInstitutionBranding(
    activeTab === 'branding' ? institutionId : undefined,
  );

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !institution) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header with quick identity banner */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#ff8a5c]/15 text-[#ff8a5c] font-bold text-lg flex items-center justify-center border border-[#ff8a5c]/20 shrink-0">
              {institution.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {institution.name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    institution.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : institution.status === 'SUSPENDED'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {institution.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-gray-500">@{institution.slug}</span>
                <button
                  onClick={() => handleCopy(institution.slug, 'Slug')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Copy slug"
                >
                  {copiedField === 'Slug' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-400 font-mono select-all">{institution.id}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
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
            Overview & Contact
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
            White-Label Branding
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'metrics'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BarChart3 size={14} />
            Operational Metrics
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Primary Contact Card */}
              <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Contact & Campus Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-medium">Official Email</div>
                      <a
                        href={`mailto:${institution.email}`}
                        className="text-sm font-semibold text-gray-900 hover:text-[#ff8a5c] transition-colors"
                      >
                        {institution.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 shrink-0">
                      <Phone size={16} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-medium">Contact Phone</div>
                      {institution.phone ? (
                        <a
                          href={`tel:${institution.phone}`}
                          className="text-sm font-semibold text-gray-900 hover:text-[#ff8a5c] transition-colors"
                        >
                          {institution.phone}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Physical Location</div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {institution.address || (
                        <span className="text-gray-400 italic">No address on record</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Timestamps & IDs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={13} />
                    <span>Onboarded Date</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {new Date(institution.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock size={13} />
                    <span>Last Profile Update</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {new Date(institution.updatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Shield size={13} />
                    <span>Recycle Bin State</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {institution.deletedAt ? (
                      <span className="text-rose-600 font-bold">Archived (In Trash)</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">Active Record</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-6">
              {isLoadingBranding ? (
                <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Fetching branding profile...</span>
                </div>
              ) : branding ? (
                <div className="space-y-5">
                  {/* Palette Preview */}
                  <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Active Color Palette
                      </h3>
                      <span className="text-xs font-mono text-gray-400">
                        Version {branding.version}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg shadow-xs shrink-0"
                          style={{ backgroundColor: branding.primaryColor }}
                        />
                        <div>
                          <div className="text-[11px] text-gray-400 font-medium">Primary</div>
                          <div className="text-xs font-mono font-bold text-gray-800">
                            {branding.primaryColor}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg shadow-xs shrink-0"
                          style={{ backgroundColor: branding.secondaryColor }}
                        />
                        <div>
                          <div className="text-[11px] text-gray-400 font-medium">Secondary</div>
                          <div className="text-xs font-mono font-bold text-gray-800">
                            {branding.secondaryColor}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg shadow-xs shrink-0"
                          style={{ backgroundColor: branding.accentColor }}
                        />
                        <div>
                          <div className="text-[11px] text-gray-400 font-medium">Accent</div>
                          <div className="text-xs font-mono font-bold text-gray-800">
                            {branding.accentColor}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Application Titles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-white border border-gray-200 rounded-xl">
                      <div className="text-xs text-gray-400">Desktop Software App Title</div>
                      <div className="text-sm font-bold text-gray-900 mt-1">
                        {branding.applicationName}
                      </div>
                    </div>
                    <div className="p-3.5 bg-white border border-gray-200 rounded-xl">
                      <div className="text-xs text-gray-400">Branded Display Name</div>
                      <div className="text-sm font-bold text-gray-900 mt-1">
                        {branding.displayName}
                      </div>
                    </div>
                  </div>

                  {/* Tagline & Registration */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                    <div>
                      <div className="text-xs text-gray-400">Mission Tagline</div>
                      <div className="text-sm font-medium text-gray-800 mt-0.5">
                        {branding.tagline || 'None'}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-400">Govt / ISO Registration Number</div>
                        <div className="text-xs font-mono font-semibold text-gray-800 mt-0.5">
                          {branding.registrationNumber || 'Not specified'}
                        </div>
                      </div>
                      {branding.website && (
                        <a
                          href={branding.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-violet-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Globe size={13} />
                          <span>Visit Website</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Signatory Information */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-start gap-4">
                    <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl shrink-0">
                      <FileSignature size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400">Authorized Examination Signatory</div>
                      <div className="text-sm font-bold text-gray-900 mt-0.5">
                        {branding.signatoryName || 'Authorized Signatory'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {branding.signatoryDesignation || 'Managing Director'}
                      </div>
                      {branding.developerCredit && (
                        <div className="text-[11px] text-gray-400 mt-2 font-mono">
                          {branding.developerCredit}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <Palette size={24} className="mx-auto text-gray-400" />
                  <div className="text-sm font-semibold text-gray-700">
                    No Custom Branding Configured
                  </div>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    This institution is currently using the system standard branding template.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4">
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Calculating institutional metrics...</span>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Users */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Enrolled Typists</span>
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={16} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                    <p className="text-[11px] text-gray-400">Students and staff in tenant</p>
                  </div>

                  {/* Devices */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Authorized Lab PCs</span>
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Monitor size={16} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalDevices}</div>
                    <p className="text-[11px] text-gray-400">Physical machines registered</p>
                  </div>

                  {/* Licenses */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Issued Licenses</span>
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Shield size={16} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalLicenses}</div>
                    <p className="text-[11px] text-gray-400">Allocated software licenses</p>
                  </div>

                  {/* Activations */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Active Seats</span>
                      <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                        <BrainCircuit size={16} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalActivations}</div>
                    <p className="text-[11px] text-gray-400">Live test runs & activations</p>
                  </div>

                  {/* Subscriptions */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Subscriptions</span>
                      <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                        <DollarSign size={16} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalSubscriptions}</div>
                    <p className="text-[11px] text-gray-400">Billing contracts on file</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm">
                  Failed to load operational metrics.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            {onOpenBranding && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBranding(institution);
                }}
                className="px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Palette size={13} />
                <span>Open Branding Studio</span>
              </button>
            )}
            {onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(institution);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Edit2 size={13} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
