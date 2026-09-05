import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Eye,
  Copy,
  Edit2,
  Power,
  AlertOctagon,
  Trash2,
  RotateCcw,
  Check,
} from 'lucide-react';
import type { License } from '../api/licenseApi';
import { toast } from 'sonner';

interface LicenseActionsDropdownProps {
  license: License;
  isSuperAdmin: boolean;
  onView: (lic: License) => void;
  onEdit: (lic: License) => void;
  onChangeStatus: (lic: License) => void;
  onRevoke: (lic: License) => void;
  onSoftDelete: (lic: License) => void;
  onRestore: (lic: License) => void;
  onPermanentDelete: (lic: License) => void;
}

export const LicenseActionsDropdown: React.FC<LicenseActionsDropdownProps> = ({
  license,
  isSuperAdmin,
  onView,
  onEdit,
  onChangeStatus,
  onRevoke,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDeleted = !!license.deletedAt;
  const isRevoked = license.status === 'REVOKED';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(license.licenseKey);
    toast.success('License key copied');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        title="License Actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-1 w-52 rounded-xl shadow-lg bg-white border border-gray-100 ring-1 ring-black/5 divide-y divide-gray-50 focus:outline-none z-30 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onView(license);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
            >
              <Eye size={14} className="text-gray-400" />
              <span>Inspect License Dossier</span>
            </button>
            <button
              type="button"
              onClick={handleCopyKey}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
            >
              <Copy size={14} className="text-gray-400" />
              <span>Copy License Key</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onEdit(license);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
            >
              <Edit2 size={14} className="text-gray-400" />
              <span>Edit Seat Capacity</span>
            </button>
          </div>

          <div className="p-1">
            {!isDeleted ? (
              <>
                {!isRevoked && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onChangeStatus(license);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
                    >
                      <Power size={14} className="text-amber-500" />
                      <span>
                        {license.status === 'ACTIVE' ? 'Suspend License' : 'Activate License'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onRevoke(license);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2.5 transition-colors"
                    >
                      <AlertOctagon size={14} className="text-red-500" />
                      <span>Revoke License Immediately</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onSoftDelete(license);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2.5 transition-colors"
                >
                  <Trash2 size={14} className="text-rose-500" />
                  <span>Move to Trash</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onRestore(license);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-2.5 transition-colors"
                >
                  <RotateCcw size={14} className="text-indigo-500" />
                  <span>Restore License</span>
                </button>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onPermanentDelete(license);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <AlertOctagon size={14} className="text-red-500" />
                    <span>Permanently Purge</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

