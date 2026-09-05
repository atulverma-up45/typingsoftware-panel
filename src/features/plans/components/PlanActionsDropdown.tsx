import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Edit3,
  Archive,
  RotateCcw,
  Trash2,
  Eye,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Plan } from '../api/planApi';

interface PlanActionsDropdownProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onToggleStatus: (plan: Plan) => void;
  onViewDetails: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onRestore?: (plan: Plan) => void;
  isDeletedView?: boolean;
}

export const PlanActionsDropdown: React.FC<PlanActionsDropdownProps> = ({
  plan,
  onEdit,
  onToggleStatus,
  onViewDetails,
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

  const handleCopyId = () => {
    navigator.clipboard.writeText(plan.id);
    toast.success('Plan ID copied to clipboard');
    setIsOpen(false);
  };

  const isArchived = plan.status === 'ARCHIVED';

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
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              onViewDetails(plan);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
          >
            <Eye size={14} className="text-gray-400" />
            View Specifications
          </button>

          <button
            type="button"
            onClick={handleCopyId}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
          >
            <Copy size={14} className="text-gray-400" />
            Copy Plan ID
          </button>

          {!isDeletedView ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onEdit(plan);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
              >
                <Edit3 size={14} className="text-blue-500" />
                Edit Configuration
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleStatus(plan);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
              >
                {isArchived ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Activate Tier
                  </>
                ) : (
                  <>
                    <Archive size={14} className="text-amber-500" />
                    Archive Tier
                  </>
                )}
              </button>

              <div className="h-px bg-gray-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  onDelete(plan);
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
                    onRestore(plan);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 text-left"
                >
                  <RotateCcw size={14} />
                  Restore Plan
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onDelete(plan);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left font-medium"
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

