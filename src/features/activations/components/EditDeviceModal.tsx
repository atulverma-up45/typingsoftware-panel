import React, { useState } from 'react';
import { Edit3, Loader2, Save } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
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

  // Sync the editable label from the selected device on every open — render-phase
  // state adjustment (pattern used by ConfirmDialog). The signature returns to
  // `null` while closed, so reopening for the same device re-syncs, matching the
  // previous `[device, isOpen]` effect behaviour.
  const [lastSyncedDevice, setLastSyncedDevice] = useState<string | null>(null);
  const syncedDeviceId = isOpen && device ? device.id : null;
  if (syncedDeviceId !== lastSyncedDevice) {
    setLastSyncedDevice(syncedDeviceId);
    if (device && isOpen) setDeviceName(device.deviceName);
  }

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
    <Modal
      isOpen={isOpen && !!device}
      onClose={onClose}
      size="md"
      title="Edit Workstation Label"
      description={device.deviceId}
      icon={<Edit3 size={20} strokeWidth={2.2} />}
      accentClassName="bg-primary-100 text-primary border-primary-200"
      closeOnBackdrop={!updateDeviceMutation.isPending}
      closeOnEscape={!updateDeviceMutation.isPending}
      showCloseButton={!updateDeviceMutation.isPending}
      bodyClassName="p-6"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={updateDeviceMutation.isPending}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-device-form"
            disabled={updateDeviceMutation.isPending || !deviceName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-colors disabled:opacity-50"
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
        </>
      }
    >
      <form id="edit-device-form" onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
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
      </form>
    </Modal>
  );
};
