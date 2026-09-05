import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  RotateCw,
  Edit3,
  ShieldAlert,
  Trash2,
  Eye,
  RotateCcw,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Subscription } from '../api/subscriptionApi';

interface SubscriptionActionsDropdownProps {
  subscription: Subscription;
  onViewDetails: (subscription: Subscription) => void;
  onRenew: (subscription: Subscription) => void;
  onEdit: (subscription: Subscription) => void;
  onChangeStatus: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
  onRestore?: (subscription: Subscription) => void;
  isDeletedView?: boolean;
}

export const SubscriptionActionsDropdown: React.FC<SubscriptionActionsDropdownProps> = ({
  subscription,
  onViewDetails,
  onRenew,
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

  const handleCopyId = () => {
    navigator.clipboard.writeText(subscription.id);
    toast.success('Subscription ID copied to clipboard');
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
              onViewDetails(subscription);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
          >
            <Eye size={14} className="text-gray-400" />
            Inspect Contract Dossier
          </button>

          <button
            type="button"
            onClick={handleCopyId}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
          >
            <Copy size={14} className="text-gray-400" />
            Copy Subscription ID
          </button>

          {!isDeletedView ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onRenew(subscription);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#ff8a5c] hover:bg-[#fff0eb]/40 text-left font-semibold"
              >
                <RotateCw size={14} />
                Renew Contract
              </button>

              <button
                type="button"
                onClick={() => {
                  onEdit(subscription);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
              >
                <Edit3 size={14} className="text-blue-500" />
                Edit Expiry & Auto-Renew
              </button>

              <button
                type="button"
                onClick={() => {
                  onChangeStatus(subscription);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
              >
                <ShieldAlert size={14} className="text-amber-500" />
                Transition Status
              </button>

              <div className="h-px bg-gray-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  onDelete(subscription);
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
                    onRestore(subscription);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 text-left font-semibold"
                >
                  <RotateCcw size={14} />
                  Restore Subscription
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onDelete(subscription);
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

