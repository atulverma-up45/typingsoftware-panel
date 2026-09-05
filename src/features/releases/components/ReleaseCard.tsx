import React, { useState } from 'react';
import {
  Package,
  HardDrive,
  Cpu,
  ShieldCheck,
  Download,
  Edit3,
  Trash2,
  Send,
  Copy,
  Check,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import type { Release } from '../api/releaseApi';
import { toast } from 'sonner';

interface ReleaseCardProps {
  release: Release;
  onEdit: (release: Release) => void;
  onStatusChange: (release: Release) => void;
  onPublish: (id: string) => void;
  onViewDetails: (release: Release) => void;
  onDelete: (release: Release) => void;
}

export const ReleaseCard: React.FC<ReleaseCardProps> = ({
  release,
  onEdit,
  onStatusChange,
  onPublish,
  onViewDetails,
  onDelete,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(release.checksum);
    setCopiedHash(true);
    toast.success('SHA-256 checksum copied to clipboard');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const downloadUrl = `/api/uploads/files/${encodeURIComponent(release.fileKey)}`;
    window.open(downloadUrl, '_blank');
  };

  const getStatusBadge = () => {
    switch (release.status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Published
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Draft
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
            Archived
          </span>
        );
    }
  };

  const getChannelBadge = () => {
    if (release.channel === 'stable') {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 border border-emerald-300">
          STABLE
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100/70 text-purple-800 border border-purple-300">
        BETA
      </span>
    );
  };

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-white p-5 shadow-sm hover:shadow-md ${
        release.status === 'ARCHIVED'
          ? 'border-gray-200 opacity-80 bg-gray-50/50'
          : 'border-gray-200 hover:border-[#ff8a5c]/50'
      }`}
    >
      <div>
        {/* Header: Version, Channel, Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center shrink-0">
              <Package size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900 tracking-tight">
                  v{release.version}
                </span>
                {getChannelBadge()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                <Cpu size={12} />
                <span>{release.platform}</span>
                {release.mandatory && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    <AlertTriangle size={9} />
                    MANDATORY
                  </span>
                )}
              </div>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Institution Scope (if tenant-specific) */}
        {release.institution && (
          <div className="mb-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs text-blue-800">
            <Building2 size={13} className="text-blue-600 shrink-0" />
            <span className="truncate font-medium">
              Custom Tenant: {release.institution.name}
            </span>
          </div>
        )}

        {/* Release Notes Preview */}
        <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
          {release.releaseNotes || 'No release notes provided for this build.'}
        </p>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-xs text-gray-600 mb-4">
          <div className="flex items-center gap-1.5">
            <HardDrive size={13} className="text-gray-400" />
            <span className="text-gray-500">Size:</span>
            <span className="font-semibold text-gray-800">{formatBytes(release.fileSize)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-gray-400" />
            <span className="text-gray-500">Min Client:</span>
            <span className="font-semibold text-gray-800">v{release.minSupportedVersion}</span>
          </div>
        </div>

        {/* SHA-256 Checksum Pill */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              SHA-256 Checksum:
            </span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="text-[#ff8a5c] hover:underline flex items-center gap-0.5 text-[10px] font-medium"
            >
              {copiedHash ? (
                <>
                  <Check size={11} className="text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy size={11} /> Copy
                </>
              )}
            </button>
          </div>
          <div className="px-2 py-1 rounded bg-gray-100/80 font-mono text-[10px] text-gray-600 truncate border border-gray-200">
            {release.checksum}
          </div>
        </div>
      </div>

      {/* Footer Meta & Actions */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(release.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          {release.publishedAt && (
            <span className="text-emerald-600 font-medium">
              Live since {new Date(release.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors"
              title="Download binary package"
            >
              <Download size={13} />
              Download
            </button>
            <button
              type="button"
              onClick={() => onViewDetails(release)}
              className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
              title="View full specifications & changelog"
            >
              Inspect
            </button>
          </div>

          <div className="flex items-center gap-1">
            {release.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => onPublish(release.id)}
                className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg shadow-sm transition-colors"
                title="Publish release to clients"
              >
                <Send size={12} />
                Publish
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(release)}
              className="p-1.5 text-gray-500 hover:text-[#ff8a5c] hover:bg-[#fff0eb] rounded-lg transition-colors"
              title="Edit release"
            >
              <Edit3 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(release)}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete release"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

