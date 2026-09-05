import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  HardDrive,
  Cpu,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Calendar,
  Layers,
  FileCode,
  Building2,
  AlertTriangle,
  Code2,
  CheckCircle2,
} from 'lucide-react';
import type { Release } from '../api/releaseApi';
import { toast } from 'sonner';

interface ReleaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: Release | null;
}

type DetailTab = 'SPECS' | 'CHANGELOG' | 'RAW';

export const ReleaseDetailModal: React.FC<ReleaseDetailModalProps> = ({
  isOpen,
  onClose,
  release,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('SPECS');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

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
    if (isOpen) {
      setActiveTab('SPECS');
    }
  }, [isOpen]);

  if (!isOpen || !release) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(release.fileKey);
    setCopiedKey(true);
    toast.success('R2 Storage key copied');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(release.checksum);
    setCopiedHash(true);
    toast.success('SHA-256 checksum copied');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(release, null, 2));
    setCopiedJson(true);
    toast.success('Metadata JSON copied');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownload = () => {
    const downloadUrl = `/api/uploads/files/${encodeURIComponent(release.fileKey)}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center">
              <Package size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Release v{release.version}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    release.channel === 'stable'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {release.channel.toUpperCase()}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600">
                  {release.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{release.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-white">
          <button
            onClick={() => setActiveTab('SPECS')}
            className={`flex items-center gap-1.5 py-3 px-2 text-xs font-bold border-b-2 transition-all mr-4 ${
              activeTab === 'SPECS'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers size={14} />
            Binary Specifications
          </button>
          <button
            onClick={() => setActiveTab('CHANGELOG')}
            className={`flex items-center gap-1.5 py-3 px-2 text-xs font-bold border-b-2 transition-all mr-4 ${
              activeTab === 'CHANGELOG'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileCode size={14} />
            Release Notes
          </button>
          <button
            onClick={() => setActiveTab('RAW')}
            className={`flex items-center gap-1.5 py-3 px-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'RAW'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Code2 size={14} />
            Raw Payload JSON
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'SPECS' && (
            <div className="space-y-4">
              {/* Primary Download Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#fff0eb]/60 border border-[#ff8a5c]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#ff8a5c] shadow-xs flex items-center justify-center">
                    <Download size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      Direct Binary Download
                    </h4>
                    <p className="text-[11px] text-gray-600">
                      Payload: {formatBytes(release.fileSize)} ({release.fileSize.toLocaleString()} bytes)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] shadow-xs transition-colors"
                >
                  <Download size={13} />
                  Download File
                </button>
              </div>

              {/* Grid of Attributes */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block mb-1 text-[11px]">Architecture / Platform</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <Cpu size={13} className="text-gray-500" />
                    {release.platform}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block mb-1 text-[11px]">Distribution Channel</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {release.channel} Channel
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block mb-1 text-[11px]">Min Supported Client</span>
                  <span className="font-semibold text-gray-800">
                    v{release.minSupportedVersion}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block mb-1 text-[11px]">Upgrade Policy</span>
                  <span className="font-semibold text-gray-800">
                    {release.mandatory ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Mandatory Upgrade
                      </span>
                    ) : (
                      <span className="text-gray-600">Optional Upgrade</span>
                    )}
                  </span>
                </div>
              </div>

              {/* SHA-256 Hex Hash */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Cryptographic SHA-256 Checksum
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="flex items-center gap-1 text-xs font-semibold text-[#ff8a5c] hover:underline"
                  >
                    {copiedHash ? (
                      <>
                        <Check size={12} className="text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy Checksum
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs text-gray-700 break-all p-2 rounded bg-white border border-gray-200 select-all">
                  {release.checksum}
                </p>
              </div>

              {/* R2 Storage Key */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <HardDrive size={14} className="text-gray-500" />
                    Cloudflare R2 Storage Key
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="flex items-center gap-1 text-xs font-semibold text-[#ff8a5c] hover:underline"
                  >
                    {copiedKey ? (
                      <>
                        <Check size={12} className="text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy Key
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs text-gray-700 break-all p-2 rounded bg-white border border-gray-200 select-all">
                  {release.fileKey}
                </p>
              </div>

              {/* Institution Scope */}
              {release.institution && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold">Restricted Institution Scope:</span>{' '}
                    {release.institution.name} ({release.institution.slug})
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'CHANGELOG' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Changelog documentation presented to users during update</span>
                {release.publishedAt && (
                  <span>Published on {new Date(release.publishedAt).toLocaleString()}</span>
                )}
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-wrap">
                {release.releaseNotes || 'No changelog or release notes provided for this release.'}
              </div>
            </div>
          )}

          {activeTab === 'RAW' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Database Record Payload</span>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 text-xs font-semibold text-[#ff8a5c] hover:underline"
                >
                  {copiedJson ? (
                    <>
                      <Check size={12} className="text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy JSON
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto max-h-[350px]">
                {JSON.stringify(release, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

