import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Laptop,
  Key,
  ShieldCheck,
  Calendar,
  Building2,
  Copy,
  Check,
  Code2,
  Lock,
  Layers,
  Activity,
  Sliders,
} from 'lucide-react';
import type { SyncOperation } from '../api/syncApi';
import { toast } from 'sonner';

interface SyncOperationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: SyncOperation | null;
}

export const SyncOperationDetailModal: React.FC<SyncOperationDetailModalProps> = ({
  isOpen,
  onClose,
  operation,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedDevice, setCopiedDevice] = useState(false);
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

  if (!isOpen || !operation) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(operation.idempotencyKey);
    setCopiedKey(true);
    toast.success('Idempotency key copied');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyDevice = () => {
    navigator.clipboard.writeText(operation.deviceId);
    setCopiedDevice(true);
    toast.success('Device ID copied');
    setTimeout(() => setCopiedDevice(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(operation, null, 2));
    setCopiedJson(true);
    toast.success('JSON record copied');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const getOperationBadge = () => {
    switch (operation.operation) {
      case 'CREATE':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            CREATE
          </span>
        );
      case 'UPDATE':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            DELETE
          </span>
        );
      default:
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
            {operation.operation}
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
              <RefreshCw size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Sync Operation Record</h2>
                {getOperationBadge()}
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{operation.id}</p>
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
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Student Privacy Contract Notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
            <Lock size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Student Privacy Enforced:</span> Per the system's privacy
              contract, student practice records and exam answers remain strictly on local workstation storage and are
              never persisted to the central cloud database. Only operational activity telemetry is logged here.
            </div>
          </div>

          {/* Grid Overview */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[11px] mb-1">Entity Classification</span>
              <span className="font-bold text-gray-800 flex items-center gap-1.5">
                {operation.entityType === 'DEVICE_ACTIVITY' ? (
                  <Activity size={14} className="text-[#ff8a5c]" />
                ) : (
                  <Sliders size={14} className="text-purple-500" />
                )}
                {operation.entityType}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[11px] mb-1">Processed Timestamp</span>
              <span className="font-medium text-gray-800 flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-500" />
                {new Date(operation.processedAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Device ID */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Laptop size={14} className="text-gray-500" />
                Workstation Device ID
              </span>
              <button
                type="button"
                onClick={handleCopyDevice}
                className="flex items-center gap-1 text-xs font-semibold text-[#ff8a5c] hover:underline"
              >
                {copiedDevice ? (
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
            <p className="font-mono text-xs text-gray-800 select-all p-2 rounded bg-white border border-gray-200">
              {operation.deviceId}
            </p>
          </div>

          {/* Idempotency Key */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                Sync Idempotency Key
              </span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="flex items-center gap-1 text-xs font-semibold text-[#ff8a5c] hover:underline"
              >
                {copiedKey ? (
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
            <p className="font-mono text-xs text-gray-800 break-all select-all p-2 rounded bg-white border border-gray-200">
              {operation.idempotencyKey}
            </p>
          </div>

          {/* Target Institution */}
          {operation.institution && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
              <Building2 size={16} className="text-blue-600 shrink-0" />
              <div>
                <span className="font-bold">Assigned Institution:</span> {operation.institution.name} ({operation.institution.slug})
              </div>
            </div>
          )}

          {/* Raw JSON Payload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Code2 size={13} />
                Raw Database Record
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
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
              {JSON.stringify(operation, null, 2)}
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

