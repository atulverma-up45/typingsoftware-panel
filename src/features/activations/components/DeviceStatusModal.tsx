import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useUpdateDeviceStatus } from '../api/deviceApi';
import type { Device, DeviceStatus } from '../api/deviceApi';

interface DeviceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export const DeviceStatusModal: React.FC<DeviceStatusModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const updateStatusMutation = useUpdateDeviceStatus();
  const [status, setStatus] = useState<DeviceStatus>('ACTIVE');
  const [reason, setReason] = useState('');

  // Sync status + clear the reason from the selected device on every open —
  // render-phase state adjustment (pattern used by ConfirmDialog). The signature
  // returns to `null` while closed, so reopening for the same device re-syncs,
  // matching the previous `[device, isOpen]` effect behaviour.
  const [lastSyncedDevice, setLastSyncedDevice] = useState<string | null>(null);
  const syncedDeviceId = isOpen && device ? device.id : null;
  if (syncedDeviceId !== lastSyncedDevice) {
    setLastSyncedDevice(syncedDeviceId);
    if (device && isOpen) {
      setStatus(device.status);
      setReason('');
    }
  }

  if (!isOpen || !device) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateStatusMutation.mutate(
      {
        id: device.id,
        data: {
          status,
          reason: reason.trim() || undefined,
        },
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
      title="Workstation Status"
      description={device.deviceName}
      icon={<RefreshCw size={20} strokeWidth={2.2} />}
      accentClassName="bg-purple-50 text-purple-600 border-purple-100"
      closeOnBackdrop={!updateStatusMutation.isPending}
      closeOnEscape={!updateStatusMutation.isPending}
      showCloseButton={!updateStatusMutation.isPending}
      bodyClassName="p-6"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={updateStatusMutation.isPending}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="device-status-form"
            disabled={updateStatusMutation.isPending || status === device.status}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Updating...
              </>
            ) : (
              'Save Status'
            )}
          </button>
        </>
      }
    >
      <form id="device-status-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-2">
            Select Operating Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'ACTIVE' as DeviceStatus, label: 'Active', icon: CheckCircle2, color: 'text-emerald-600' },
              { id: 'SUSPECT' as DeviceStatus, label: 'Suspect', icon: AlertTriangle, color: 'text-amber-600' },
              { id: 'REVOKED' as DeviceStatus, label: 'Revoked', icon: ShieldAlert, color: 'text-rose-600' },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = status === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatus(opt.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-primary bg-primary-100/50 text-gray-900 shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className={`mb-1.5 ${opt.color}`} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {status === 'SUSPECT' && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <strong>Suspect Status:</strong> Flags this terminal for administrative review due to unexpected hardware fingerprint changes or anomalies.
          </div>
        )}

        {status === 'REVOKED' && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
            <strong>Revocation:</strong> Deauthorizes this workstation from synchronizing or launching protected exam content.
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Audit Justification / Note (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Workstation relocated or motherboard replaced"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
          />
        </div>
      </form>
    </Modal>
  );
};
