import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Eye,
  Edit3,
  FileCheck2,
  Trash2,
  RotateCcw,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ContentItem } from '../api/contentApi';

interface ContentActionsDropdownProps {
  item: ContentItem;
  onViewDetails: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onChangeStatus: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onRestore?: (item: ContentItem) => void;
  isDeletedView?: boolean;
}

export const ContentActionsDropdown: React.FC<ContentActionsDropdownProps> = ({
  item,
  onViewDetails,
  onEdit,
  onChangeStatus,
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

  const handleCopyText = () => {
    const text = item.payload?.text || '';
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success('Passage text copied to clipboard');
    } else {
      navigator.clipboard.writeText(item.id);
      toast.success('Content ID copied to clipboard');
    }
    setIsOpen(false);
  };

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
              onViewDetails(item);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
          >
            <Eye size={14} className="text-gray-400" />
            Inspect Passage & Rules
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
          >
            <Copy size={14} className="text-gray-400" />
            Copy Passage Text
          </button>

          {!isDeletedView ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onEdit(item);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
              >
                <Edit3 size={14} className="text-blue-500" />
                Edit Passage & Settings
              </button>

              <button
                type="button"
                onClick={() => {
                  onChangeStatus(item);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#ff8a5c] hover:bg-[#fff0eb]/50 text-left font-semibold"
              >
                <FileCheck2 size={14} />
                Change Publication State
              </button>

              <div className="h-px bg-gray-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  onDelete(item);
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
                    onRestore(item);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 text-left font-semibold"
                >
                  <RotateCcw size={14} />
                  Restore Content
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onDelete(item);
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

