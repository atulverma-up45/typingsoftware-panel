import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Eye,
  Copy,
  Cpu,
  PauseCircle,
  PlayCircle,
  AlertOctagon,
} from 'lucide-react';
import type { Activation } from '../api/activationApi';
import { toast } from 'sonner';

interface ActivationActionsDropdownProps {
  activation: Activation;
  isSuperAdmin: boolean;
  onView: (act: Activation) => void;
  onDeactivate: (act: Activation) => void;
  onReactivate: (act: Activation) => void;
  onRevoke: (act: Activation) => void;
}

export const ActivationActionsDropdown: React.FC<ActivationActionsDropdownProps> = ({
  activation,
  isSuperAdmin,
  onView,
  onDeactivate,
  onReactivate,
  onRevoke,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleCopyUUID = () => {
    navigator.clipboard.writeText(activation.deviceId);
    toast.success('Device UUID copied');
    setIsOpen(false);
  };

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(activation.hardwareFingerprint);
    toast.success('Hardware fingerprint copied');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        title="Workstation Actions"
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
                onView(activation);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
            >
              <Eye size={14} className="text-gray-400" />
              <span>Inspect Station Dossier</span>
            </button>
            <button
              type="button"
              onClick={handleCopyUUID}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
            >
              <Copy size={14} className="text-gray-400" />
              <span>Copy Device UUID</span>
            </button>
            <button
              type="button"
              onClick={handleCopyFingerprint}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
            >
              <Cpu size={14} className="text-gray-400" />
              <span>Copy Hardware Fingerprint</span>
            </button>
          </div>

          <div className="p-1">
            {activation.status === 'ACTIVE' && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onDeactivate(activation);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-2.5 transition-colors"
              >
                <PauseCircle size={14} className="text-amber-500" />
                <span>Deactivate Seat Slot</span>
              </button>
            )}

            {activation.status === 'DEACTIVATED' && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onReactivate(activation);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2.5 transition-colors"
              >
                <PlayCircle size={14} className="text-emerald-500" />
                <span>Reactivate Seat</span>
              </button>
            )}

            {activation.status !== 'REVOKED' && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onRevoke(activation);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2.5 transition-colors"
              >
                <AlertOctagon size={14} className="text-red-500" />
                <span>Revoke & Blacklist</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

