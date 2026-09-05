import React, { useState, useEffect } from 'react';
import {
  X,
  Monitor,
  Cpu,
  ShieldCheck,
  Calendar,
  Building2,
  Copy,
  Check,
  Code2,
  Clock,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import type { Device } from '../api/deviceApi';
import { toast } from 'sonner';

interface DeviceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !device) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(device.deviceId);
    setCopiedId(true);
    toast.success('Device UUID copied');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(device.hardwareFingerprint);
    setCopiedFingerprint(true);
    toast.success('Hardware fingerprint copied');
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(device, null, 2));
    setCopiedJson(true);
    toast.success('Device JSON copied');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const getStatusBadge = () => {
    switch (device.status) {
      case 'ACTIVE':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active Terminal
          </span>
        );
      case 'SUSPECT':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            Suspect Anomaly
          </span>
        );
      case 'REVOKED':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            Revoked
          </span>
        );
      default:
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
            {device.status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Monitor size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">{device.deviceName}</h2>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{device.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Hardware Fingerprint */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-700 flex items-center gap-1.5">
                <Cpu size={14} className="text-[#ff8a5c]" />
                Hardware Cryptographic Fingerprint
              </span>
              <button
                type="button"
                onClick={handleCopyFingerprint}
                className="flex items-center gap-1 font-semibold text-[#ff8a5c] hover:underline"
              >
                {copiedFingerprint ? (
                  <>
                    <Check size={12} className="text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-gray-800 break-all select-all p-2 rounded bg-white border border-gray-200">
              {device.hardwareFingerprint}
            </p>
          </div>

          {/* Installation UUID */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-700 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                Persistent Workstation UUID
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="flex items-center gap-1 font-semibold text-[#ff8a5c] hover:underline"
              >
                {copiedId ? (
                  <>
                    <Check size={12} className="text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-gray-800 break-all select-all p-2 rounded bg-white border border-gray-200">
              {device.deviceId}
            </p>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[11px] mb-1">Operating System</span>
              <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                <Monitor size={13} className="text-gray-500 shrink-0" />
                {device.osVersion}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[11px] mb-1">Client App Version</span>
              <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                <Layers size={13} className="text-purple-500 shrink-0" />
                v{device.appVersion}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[11px] mb-1">First Activated</span>
              <span className="font-medium text-gray-800 flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-500 shrink-0" />
                {new Date(device.firstActivatedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[11px] mb-1">Last Heartbeat Seen</span>
              <span className="font-medium text-gray-800 flex items-center gap-1.5">
                <Clock size={13} className="text-gray-500 shrink-0" />
                {new Date(device.lastSeenAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Institution */}
          {device.institution && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 flex items-center gap-2">
              <Building2 size={16} className="text-blue-600 shrink-0" />
              <div>
                <span className="font-bold">Assigned Lab Institution:</span> {device.institution.name} ({device.institution.slug})
              </div>
            </div>
          )}

          {/* Raw JSON */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-gray-700 flex items-center gap-1">
                <Code2 size={13} />
                Raw Database Payload
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                {copiedJson ? (
                  <>
                    <Check size={12} className="text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy JSON
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-gray-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-[160px]">
              {JSON.stringify(device, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

