import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Download,
  Eye,
  Edit3,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import type { Release } from '../api/releaseApi';

interface ReleaseActionsDropdownProps {
  release: Release;
  onViewDetails: (release: Release) => void;
  onEdit: (release: Release) => void;
  onStatusChange: (release: Release) => void;
  onPublish: (id: string) => void;
  onDelete: (release: Release) => void;
}

export const ReleaseActionsDropdown: React.FC<ReleaseActionsDropdownProps> = ({
  release,
  onViewDetails,
  onEdit,
  onStatusChange,
  onPublish,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDownload = () => {
    setIsOpen(false);
    const downloadUrl = `/api/uploads/files/${encodeURIComponent(release.fileKey)}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Release actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-1 w-48 origin-top-right rounded-xl bg-white p-1.5 shadow-lg border border-gray-100 focus:outline-none animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Download size={14} className="text-emerald-600" />
            Download Installer
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onViewDetails(release);
            }}
            className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Eye size={14} className="text-gray-500" />
            Inspect Specifications
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onEdit(release);
            }}
            className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Edit3 size={14} className="text-[#ff8a5c]" />
            Edit Release
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onStatusChange(release);
            }}
            className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className="text-blue-500" />
            Change Status
          </button>

          {release.status === 'DRAFT' && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onPublish(release.id);
              }}
              className="flex items-center w-full gap-2 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Send size={14} className="text-emerald-600" />
              Publish to Fleet
            </button>
          )}

          <div className="my-1 border-t border-gray-100" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDelete(release);
            }}
            className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
            Delete Release
          </button>
        </div>
      )}
    </div>
  );
};

