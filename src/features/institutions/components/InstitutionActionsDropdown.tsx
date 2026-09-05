import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Eye,
  Edit2,
  Palette,
  Power,
  Trash2,
  RotateCcw,
  AlertOctagon,
} from 'lucide-react';
import type { Institution } from '../api/institutionApi';

interface InstitutionActionsDropdownProps {
  institution: Institution;
  isSuperAdmin: boolean;
  onView: (inst: Institution) => void;
  onEdit: (inst: Institution) => void;
  onBranding: (inst: Institution) => void;
  onChangeStatus: (inst: Institution) => void;
  onSoftDelete: (inst: Institution) => void;
  onRestore: (inst: Institution) => void;
  onPermanentDelete: (inst: Institution) => void;
}

export const InstitutionActionsDropdown: React.FC<InstitutionActionsDropdownProps> = ({
  institution,
  isSuperAdmin,
  onView,
  onEdit,
  onBranding,
  onChangeStatus,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDeleted = !!institution.deletedAt;

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

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        title="Institution Actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-1 w-52 rounded-xl shadow-lg bg-white border border-gray-100 ring-1 ring-black/5 divide-y divide-gray-50 focus:outline-none z-30 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onView(institution);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
            >
              <Eye size={14} className="text-gray-400" />
              <span>View Full Dossier</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onEdit(institution);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
            >
              <Edit2 size={14} className="text-gray-400" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onBranding(institution);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50 rounded-lg flex items-center gap-2.5 transition-colors"
            >
              <Palette size={14} className="text-violet-500" />
              <span>White-Label Branding</span>
            </button>
          </div>

          {isSuperAdmin && (
            <div className="p-1">
              {!isDeleted ? (
                <>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onChangeStatus(institution);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <Power size={14} className="text-amber-500" />
                    <span>Change Status</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onSoftDelete(institution);
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
                    onClick={() => {
                      setIsOpen(false);
                      onRestore(institution);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <RotateCcw size={14} className="text-indigo-500" />
                    <span>Restore Center</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onPermanentDelete(institution);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <AlertOctagon size={14} className="text-red-500" />
                    <span>Permanently Purge</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
