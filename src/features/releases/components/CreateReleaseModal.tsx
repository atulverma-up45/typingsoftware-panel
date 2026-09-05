import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Package,
  UploadCloud,
  FileCheck2,
  HardDrive,
  Cpu,
  ShieldCheck,
  Building2,
  Sparkles,
  AlertTriangle,
  Loader2,
  FileCode,
  Layers,
  Send,
} from 'lucide-react';
import { useCreateRelease, useUploadBinary } from '../api/releaseApi';
import type {
  CreateReleaseInput,
  ReleasePlatform,
  ReleaseChannel,
  ReleaseStatus,
} from '../api/releaseApi';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { toast } from 'sonner';

interface CreateReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateReleaseModal: React.FC<CreateReleaseModalProps> = ({ isOpen, onClose }) => {
  const createReleaseMutation = useCreateRelease();
  const uploadBinaryMutation = useUploadBinary();

  const { data: institutionsData } = useInstitutions({ limit: 100, status: 'ACTIVE' });
  const institutions = institutionsData?.data || [];

  // Form state
  const [version, setVersion] = useState('');
  const [platform, setPlatform] = useState<ReleasePlatform>('windows-x64');
  const [channel, setChannel] = useState<ReleaseChannel>('stable');
  const [fileKey, setFileKey] = useState('');
  const [checksum, setChecksum] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [minSupportedVersion, setMinSupportedVersion] = useState('1.0.0');
  const [status, setStatus] = useState<ReleaseStatus>('DRAFT');
  const [isTenantSpecific, setIsTenantSpecific] = useState(false);
  const [institutionId, setInstitutionId] = useState('');

  // Upload telemetry state
  const [isManualMode, setIsManualMode] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isCalculatingHash, setIsCalculatingHash] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setVersion('');
      setPlatform('windows-x64');
      setChannel('stable');
      setFileKey('');
      setChecksum('');
      setFileSize(0);
      setReleaseNotes('');
      setMandatory(false);
      setMinSupportedVersion('1.0.0');
      setStatus('DRAFT');
      setIsTenantSpecific(false);
      setInstitutionId('');
      setUploadFile(null);
      setIsCalculatingHash(false);
      setUploadProgress(null);
      setIsManualMode(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const calculateSHA256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileSelect = async (file: File) => {
    setUploadFile(file);
    setFileSize(file.size);

    // Auto extract version if file is named like TypingMaster-Setup-1.2.0.exe
    const versionMatch = file.name.match(/\b\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?\b/);
    if (versionMatch && !version) {
      setVersion(versionMatch[0]);
    }

    try {
      setIsCalculatingHash(true);
      toast.info('Calculating SHA-256 binary checksum in browser...');
      const calculatedHash = await calculateSHA256(file);
      setChecksum(calculatedHash);
      setIsCalculatingHash(false);
      toast.success('SHA-256 checksum calculated successfully');

      // Now initiate binary upload to R2
      setUploadProgress(0);
      const result = await uploadBinaryMutation.mutateAsync({
        file,
        category: 'releases',
        onProgress: (percent) => setUploadProgress(percent),
      });

      setFileKey(result.key);
      setUploadProgress(null);
      toast.success('Binary installer uploaded to Cloudflare R2');
    } catch (err: any) {
      setIsCalculatingHash(false);
      setUploadProgress(null);
      toast.error('Failed processing installer binary: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
    if (!semverRegex.test(version.trim())) {
      toast.error('Version must be a valid semantic version (e.g. 1.2.0)');
      return;
    }

    if (!semverRegex.test(minSupportedVersion.trim())) {
      toast.error('Minimum supported version must be valid semantic version (e.g. 1.0.0)');
      return;
    }

    if (!fileKey.trim()) {
      toast.error('File key is required. Please upload an installer or supply a key.');
      return;
    }

    if (!checksum.trim() || checksum.trim().length !== 64) {
      toast.error('Checksum must be a valid 64-character SHA-256 hex string');
      return;
    }

    if (fileSize <= 0) {
      toast.error('File size must be positive bytes');
      return;
    }

    const payload: CreateReleaseInput = {
      version: version.trim(),
      platform,
      channel,
      fileKey: fileKey.trim(),
      checksum: checksum.trim().toLowerCase(),
      fileSize: Number(fileSize),
      releaseNotes: releaseNotes.trim() || undefined,
      mandatory,
      minSupportedVersion: minSupportedVersion.trim(),
      status,
      institutionId: isTenantSpecific && institutionId ? institutionId : null,
    };

    createReleaseMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center">
              <Package size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Publish New Software Release</h2>
              <p className="text-xs text-gray-500">
                Deploy desktop installers, checksums, and update rules to client workstations
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Binary Package Uploader & SHA-256 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud size={14} className="text-[#ff8a5c]" />
                Installer Binary & Checksum
              </label>
              <button
                type="button"
                onClick={() => setIsManualMode(!isManualMode)}
                className="text-xs font-semibold text-[#ff8a5c] hover:underline"
              >
                {isManualMode ? 'Switch to Direct Uploader' : 'Switch to Manual File Key'}
              </button>
            </div>

            {!isManualMode ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                  fileKey
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-gray-200 hover:border-[#ff8a5c]/60 bg-gray-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".exe,.msi,.zip,.tar.gz"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {isCalculatingHash ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={32} className="animate-spin text-[#ff8a5c]" />
                    <p className="text-sm font-semibold text-gray-800">
                      Computing SHA-256 Checksum...
                    </p>
                    <p className="text-xs text-gray-500">
                      Hashing binary content using client Web Crypto API
                    </p>
                  </div>
                ) : uploadProgress !== null ? (
                  <div className="w-full max-w-xs flex flex-col items-center gap-2">
                    <Loader2 size={28} className="animate-spin text-[#ff8a5c]" />
                    <p className="text-sm font-semibold text-gray-800">
                      Uploading to Cloudflare R2 ({uploadProgress}%)
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#ff8a5c] h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : fileKey ? (
                  <div className="flex flex-col items-center gap-1.5 text-emerald-800">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
                      <FileCheck2 size={22} />
                    </div>
                    <p className="text-sm font-bold">
                      {uploadFile?.name || 'Binary Package Ready'}
                    </p>
                    <p className="text-xs text-emerald-700">
                      {formatBytes(fileSize)} • Storage Key: <span className="font-mono">{fileKey}</span>
                    </p>
                    <span className="text-[11px] font-medium text-emerald-600 underline mt-1">
                      Click to replace binary file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-gray-100 flex items-center justify-center text-gray-400">
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Drag & Drop Windows Installer (.exe, .msi, .zip)
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Automatically calculates SHA-256 hash & uploads directly to Cloudflare R2
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Storage File Key *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="releases/windows/TypingMaster-1.2.0.exe"
                    value={fileKey}
                    onChange={(e) => setFileKey(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    File Size (Bytes) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="47418240"
                    value={fileSize || ''}
                    onChange={(e) => setFileSize(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c]"
                  />
                </div>
              </div>
            )}

            {/* SHA-256 Checksum Field */}
            <div className="mt-3">
              <label className="text-xs font-semibold text-gray-700 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  SHA-256 Hexadecimal Checksum *
                </span>
                <span className="text-[11px] text-gray-400">Must be 64 hexadecimal characters</span>
              </label>
              <input
                type="text"
                required
                maxLength={64}
                placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                value={checksum}
                onChange={(e) => setChecksum(e.target.value.trim().toLowerCase())}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c]"
              />
            </div>
          </div>

          {/* Section 2: Version & Target Platform */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Semantic Version *
              </label>
              <input
                type="text"
                required
                placeholder="1.2.0"
                value={version}
                onChange={(e) => setVersion(e.target.value.trim())}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c]"
              />
              <p className="text-[10px] text-gray-400 mt-1">e.g. 1.0.0, 1.2.4-beta.1</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Target Platform *
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
                Distribution Channel *
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

          {/* Section 3: Compatibility & Mandatory Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Minimum Supported Client Version
              </label>
              <input
                type="text"
                required
                placeholder="1.0.0"
                value={minSupportedVersion}
                onChange={(e) => setMinSupportedVersion(e.target.value.trim())}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Workstations below this version will be forced to upgrade
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Mandatory Update Policy
              </label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={mandatory}
                  onChange={(e) => setMandatory(e.target.checked)}
                  className="w-4 h-4 rounded text-[#ff8a5c] focus:ring-[#ff8a5c]"
                />
                <span className="text-xs font-medium text-gray-800">
                  Enforce Mandatory Workstation Upgrade
                </span>
              </label>
              <p className="text-[10px] text-gray-400 mt-1">
                If checked, users cannot dismiss or skip this update notification
              </p>
            </div>
          </div>

          {/* Section 4: Publication Status & Institution Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Initial Publication Status
              </label>
              <div className="flex gap-2">
                {(['DRAFT', 'PUBLISHED'] as ReleaseStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      status === st
                        ? 'bg-[#fff0eb] border-[#ff8a5c] text-[#ff8a5c]'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {st === 'PUBLISHED' ? 'Publish Immediately' : 'Save as Draft'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Target Distribution Scope
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTenantSpecific}
                    onChange={(e) => setIsTenantSpecific(e.target.checked)}
                    className="w-4 h-4 rounded text-[#ff8a5c] focus:ring-[#ff8a5c]"
                  />
                  <span className="text-xs font-medium text-gray-800">
                    Restricted to Specific Institution (Custom Build)
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
            </div>
          </div>

          {/* Section 5: Release Notes & Changelog */}
          <div>
            <label className="text-xs font-semibold text-gray-700 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5">
                <FileCode size={13} />
                Release Notes & Changelog (Markdown)
              </span>
              <span className="text-[11px] text-gray-400">Displayed in client update dialog</span>
            </label>
            <textarea
              rows={4}
              placeholder="### What's New in v1.2.0:&#10;- Added Remington Gail keyboard layout&#10;- Improved offline sync latency&#10;- Fixed exam timer suspension bug"
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              className="w-full text-xs font-mono p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
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
              disabled={createReleaseMutation.isPending || isCalculatingHash || uploadProgress !== null}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {createReleaseMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating Release...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Deploy Release
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

