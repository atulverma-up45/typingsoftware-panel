import React from 'react';
import { Package, AlertTriangle, Download, Copy, Check } from 'lucide-react';
import { ReleaseActionsDropdown } from './ReleaseActionsDropdown';
import type { Release } from '../api/releaseApi';

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface ReleaseTableViewProps {
  releases: Release[];
  copiedHashId: string | null;
  onCopyHash: (id: string, hash: string, e: React.MouseEvent) => void;
  onViewDetails: (release: Release) => void;
  onEdit: (release: Release) => void;
  onStatusChange: (release: Release) => void;
  onPublish: (id: string) => void;
  onDelete: (release: Release) => void;
}

export const ReleaseTableView: React.FC<ReleaseTableViewProps> = ({
  releases,
  copiedHashId,
  onCopyHash,
  onViewDetails,
  onEdit,
  onStatusChange,
  onPublish,
  onDelete,
}) => {
  return (
    <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th scope="col" className="py-3 px-4">Version & Platform</th>
              <th scope="col" className="py-3 px-4">Channel</th>
              <th scope="col" className="py-3 px-4">Status</th>
              <th scope="col" className="py-3 px-4">Size & Checksum</th>
              <th scope="col" className="py-3 px-4">Upgrade Policy</th>
              <th scope="col" className="py-3 px-4">Published Date</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {releases.map((rel) => (
              <tr key={rel.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary flex items-center justify-center shrink-0">
                      <Package size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">v{rel.version}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{rel.platform}</div>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      rel.channel === 'stable'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {rel.channel.toUpperCase()}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      rel.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : rel.status === 'DRAFT'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rel.status}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-gray-800">
                      {formatBytes(rel.fileSize)}
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[10px] text-gray-400">
                      <span>{rel.checksum.slice(0, 10)}...</span>
                      <button
                        type="button"
                        onClick={(e) => onCopyHash(rel.id, rel.checksum, e)}
                        className="text-gray-400 hover:text-primary"
                        title="Copy SHA-256"
                      >
                        {copiedHashId === rel.id ? (
                          <Check size={11} className="text-emerald-600" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  {rel.mandatory ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <AlertTriangle size={10} />
                      Mandatory
                    </span>
                  ) : (
                    <span className="text-gray-500 text-[11px]">Optional</span>
                  )}
                  <div className="text-[10px] text-gray-400">Min: v{rel.minSupportedVersion}</div>
                </td>

                <td className="py-3.5 px-4 text-gray-500">
                  {rel.publishedAt ? (
                    <div>
                      <span className="font-medium text-gray-800">
                        {new Date(rel.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <span className="italic text-gray-400">Not published</span>
                  )}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const downloadUrl = `/api/uploads/files/${encodeURIComponent(rel.fileKey)}`;
                        window.open(downloadUrl, '_blank');
                      }}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Download binary"
                    >
                      <Download size={14} />
                    </button>
                    <ReleaseActionsDropdown
                      release={rel}
                      onViewDetails={onViewDetails}
                      onEdit={onEdit}
                      onStatusChange={onStatusChange}
                      onPublish={onPublish}
                      onDelete={onDelete}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

