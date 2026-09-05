import React, { useState, useEffect } from 'react';
import { X, Edit3, Monitor, Loader2, Save } from 'lucide-react';
import { useUpdateDevice } from '../api/deviceApi';
import type { Device } from '../api/deviceApi';

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const updateDeviceMutation = useUpdateDevice();
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (device && isOpen) {
      setDeviceName(device.deviceName);
    }
  }, [device, isOpen]);

  if (!isOpen || !device) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateDeviceMutation.mutate(
      {
        id: device.id,
        data: { deviceName: deviceName.trim() },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center">
              <Edit3 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Edit Workstation Label</h2>
              <p className="text-xs text-gray-500 font-mono">{device.deviceId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Friendly Device Name / Room Label *
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              placeholder="e.g. Lab 1 - Workstation #04"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c]"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Used by lab supervisors to locate and manage the physical computer
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1 text-gray-600">
            <div><strong>OS Version:</strong> {device.osVersion}</div>
            <div><strong>App Version:</strong> v{device.appVersion}</div>
            <div><strong>Fingerprint:</strong> <span className="font-mono text-[11px]">{device.hardwareFingerprint.slice(0, 16)}...</span></div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateDeviceMutation.isPending || !deviceName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {updateDeviceMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Label
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

