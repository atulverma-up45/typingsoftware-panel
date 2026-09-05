import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Eye,
  Edit3,
  CheckCircle2,
  XCircle,
  Sliders,
  Trash2,
  RotateCcw,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TypingModule } from '../api/moduleApi';

interface ModuleActionsDropdownProps {
  module: TypingModule;
  onViewDetails: (module: TypingModule) => void;
  onEdit: (module: TypingModule) => void;
  onToggleStatus: (module: TypingModule) => void;
  onConfigureOverride: (module: TypingModule) => void;
  onDelete: (module: TypingModule) => void;
  onRestore?: (module: TypingModule) => void;
  isDeletedView?: boolean;
}

export const ModuleActionsDropdown: React.FC<ModuleActionsDropdownProps> = ({
  module,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onConfigureOverride,
  onDelete,
  onRestore,
  isDeletedView = false,
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

  const handleCopyKey = () => {
    navigator.clipboard.writeText(module.key);
    toast.success('Module key copied to clipboard');
    setIsOpen(false);
  };

  const isActive = module.status === 'ACTIVE';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              onViewDetails(module);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
          >
            <Eye size={14} className="text-gray-400" />
            Inspect Specifications
          </button>

          <button
            type="button"
            onClick={handleCopyKey}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
          >
            <Copy size={14} className="text-gray-400" />
            Copy Module Key
          </button>

          {!isDeletedView ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onEdit(module);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50/50 text-left"
              >
                <Edit3 size={14} />
                Edit Configuration
              </button>

              <button
                type="button"
                onClick={() => {
                  onConfigureOverride(module);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#ff8a5c] hover:bg-[#fff0eb]/50 text-left font-semibold"
              >
                <Sliders size={14} />
                Configure Tenant Override
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleStatus(module);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
              >
                {isActive ? (
                  <>
                    <XCircle size={14} className="text-gray-400" />
                    Deactivate Module
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Activate Module
                  </>
                )}
              </button>

              <div className="h-px bg-gray-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  onDelete(module);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left"
              >
                <Trash2 size={14} />
                Move to Trash
              </button>
            </>
          ) : (
            <>
              {onRestore && (
                <button
                  type="button"
                  onClick={() => {
                    onRestore(module);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 text-left font-semibold"
                >
                  <RotateCcw size={14} />
                  Restore Module
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onDelete(module);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left font-bold"
              >
                <Trash2 size={14} />
                Permanently Purge
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

