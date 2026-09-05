import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Eye,
  Edit3,
  RefreshCw,
  ShieldAlert,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import type { Device } from '../api/deviceApi';

interface DeviceActionsDropdownProps {
  device: Device;
  onViewDetails: (device: Device) => void;
  onEdit: (device: Device) => void;
  onStatusChange: (device: Device) => void;
  onRevoke: (device: Device) => void;
  onDelete: (device: Device) => void;
  onRestore?: (device: Device) => void;
  isDeleted?: boolean;
}

export const DeviceActionsDropdown: React.FC<DeviceActionsDropdownProps> = ({
  device,
  onViewDetails,
  onEdit,
  onStatusChange,
  onRevoke,
  onDelete,
  onRestore,
  isDeleted = false,
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

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Workstation actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-1 w-44 origin-top-right rounded-xl bg-white p-1.5 shadow-lg border border-gray-100 focus:outline-none animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onViewDetails(device);
            }}
            className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Eye size={14} className="text-gray-500" />
            Inspect Hardware
          </button>

          {!isDeleted ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onEdit(device);
                }}
                className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Edit3 size={14} className="text-[#ff8a5c]" />
                Edit Room / Label
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onStatusChange(device);
                }}
                className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <RefreshCw size={14} className="text-purple-500" />
                Change Status
              </button>

              {device.status !== 'REVOKED' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onRevoke(device);
                  }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  <ShieldAlert size={14} className="text-amber-600" />
                  Revoke Access
                </button>
              )}

              <div className="my-1 border-t border-gray-100" />

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onDelete(device);
                }}
                className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                    setIsOpen(false);
                    onRestore(device);
                  }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <RotateCcw size={14} />
                  Restore Device
                </button>
              )}

              <div className="my-1 border-t border-gray-100" />

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onDelete(device);
                }}
                className="flex items-center w-full gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                Purge Permanently
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

