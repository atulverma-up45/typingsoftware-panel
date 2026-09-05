import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Package,
  Layers,
  FileCode,
  Building2,
  AlertTriangle,
  Loader2,
  Save,
} from 'lucide-react';
import { useUpdateRelease } from '../api/releaseApi';
import type {
  Release,
  UpdateReleaseInput,
  ReleasePlatform,
  ReleaseChannel,
  ReleaseStatus,
} from '../api/releaseApi';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { toast } from 'sonner';

interface EditReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: Release | null;
}

export const EditReleaseModal: React.FC<EditReleaseModalProps> = ({
  isOpen,
  onClose,
  release,
}) => {
  const updateReleaseMutation = useUpdateRelease();
  const { data: institutionsData } = useInstitutions({ limit: 100, status: 'ACTIVE' });
  const institutions = institutionsData?.data || [];

  const [platform, setPlatform] = useState<ReleasePlatform>('windows-x64');
  const [channel, setChannel] = useState<ReleaseChannel>('stable');
  const [minSupportedVersion, setMinSupportedVersion] = useState('1.0.0');
  const [mandatory, setMandatory] = useState(false);
  const [status, setStatus] = useState<ReleaseStatus>('DRAFT');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [institutionId, setInstitutionId] = useState<string>('');
  const [isTenantSpecific, setIsTenantSpecific] = useState(false);

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
      setPlatform(release.platform);
      setChannel(release.channel);
      setMinSupportedVersion(release.minSupportedVersion || '1.0.0');
      setMandatory(release.mandatory);
      setStatus(release.status);
      setReleaseNotes(release.releaseNotes || '');
      setInstitutionId(release.institutionId || '');
      setIsTenantSpecific(!!release.institutionId);
    }
  }, [release, isOpen]);

  if (!isOpen || !release) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
    if (!semverRegex.test(minSupportedVersion.trim())) {
      toast.error('Minimum supported version must be a valid semantic version (e.g. 1.0.0)');
      return;
    }

    const payload: UpdateReleaseInput = {
      platform,
      channel,
      minSupportedVersion: minSupportedVersion.trim(),
      mandatory,
      status,
      releaseNotes: releaseNotes.trim() || undefined,
      institutionId: isTenantSpecific && institutionId ? institutionId : null,
    };

    updateReleaseMutation.mutate(
      { id: release.id, data: payload },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center">
              <Edit3 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Edit Release v{release.version}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                  {release.id}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Update distribution channel, minimum client version, and release notes
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Read-only Specs Alert */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <Package size={14} className="text-[#ff8a5c]" />
              <span>Storage Key: <strong className="font-mono text-gray-800">{release.fileKey}</strong></span>
            </div>
            <span className="text-gray-400 font-mono text-[11px] truncate max-w-[150px]">
              SHA: {release.checksum.slice(0, 12)}...
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Target Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as ReleasePlatform)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white"
              >
                <option value="windows-x64">Windows (64-bit x64)</option>
                <option value="windows-arm64">Windows (ARM64)</option>
                <option value="windows-x86">Windows (32-bit x86)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Distribution Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ReleaseChannel)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white"
              >
                <option value="stable">Stable (Production Fleet)</option>
                <option value="beta">Beta (Preview Testers)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Minimum Supported Client Version
              </label>
              <input
                type="text"
                required
                value={minSupportedVersion}
                onChange={(e) => setMinSupportedVersion(e.target.value.trim())}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReleaseStatus)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mandatory}
                onChange={(e) => setMandatory(e.target.checked)}
                className="w-4 h-4 rounded text-[#ff8a5c] focus:ring-[#ff8a5c]"
              />
              <span className="text-xs font-semibold text-gray-800">
                Mark as Mandatory Workstation Upgrade
              </span>
            </label>
            <p className="text-[11px] text-gray-400 mt-1 pl-6">
              Workstations encountering this release will require an upgrade before continuing.
            </p>
          </div>

          {/* Scope */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTenantSpecific}
                onChange={(e) => setIsTenantSpecific(e.target.checked)}
                className="w-4 h-4 rounded text-[#ff8a5c] focus:ring-[#ff8a5c]"
              />
              <span className="text-xs font-semibold text-gray-800">
                Custom Tenant Build (Restricted to Institution)
              </span>
            </label>
            {isTenantSpecific && (
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white"
              >
                <option value="">Select target institution...</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.slug})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Release Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Release Notes (Markdown)
            </label>
            <textarea
              rows={4}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              className="w-full text-xs font-mono p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] leading-relaxed"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateReleaseMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {updateReleaseMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

