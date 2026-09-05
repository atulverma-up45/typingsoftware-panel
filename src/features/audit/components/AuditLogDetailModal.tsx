import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  User,
  Building2,
  Calendar,
  Globe,
  Monitor,
  Key,
  Copy,
  Check,
  Code2,
  Layers,
  FileCode,
  Tag,
  Clock,
} from 'lucide-react';
import type { AuditLog } from '../api/auditApi';
import { toast } from 'sonner';

interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLog: AuditLog | null;
}

type DetailTab = 'SUMMARY' | 'METADATA' | 'RAW';

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  isOpen,
  onClose,
  auditLog,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('SUMMARY');
  const [copiedEntityId, setCopiedEntityId] = useState(false);
  const [copiedActorId, setCopiedActorId] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      setActiveTab('SUMMARY');
    }
  }, [isOpen]);

  if (!isOpen || !auditLog) return null;

  const handleCopyEntityId = () => {
    navigator.clipboard.writeText(auditLog.entityId);
    setCopiedEntityId(true);
    toast.success('Entity ID copied to clipboard');
    setTimeout(() => setCopiedEntityId(false), 2000);
  };

  const handleCopyActorId = () => {
    if (!auditLog.actorId) return;
    navigator.clipboard.writeText(auditLog.actorId);
    setCopiedActorId(true);
    toast.success('Actor ID copied to clipboard');
    setTimeout(() => setCopiedActorId(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(auditLog, null, 2));
    setCopiedJson(true);
    toast.success('Audit log JSON copied');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const getActionBadge = () => {
    const action = auditLog.action.toUpperCase();
    let colorClass = 'bg-blue-50 text-blue-700 border-blue-200';

    if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('PURGE') || action.includes('SUSPEND')) {
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (action.includes('CREATE') || action.includes('ACTIVATE') || action.includes('PUBLISH') || action.includes('RESTORE') || action.includes('RENEW')) {
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('STATUS')) {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return (
      <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border ${colorClass}`}>
        {auditLog.action}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Audit Forensics Record</h2>
                {getActionBadge()}
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{auditLog.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-white">
          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`flex items-center gap-1.5 py-3 px-2 text-xs font-bold border-b-2 transition-all mr-4 ${
              activeTab === 'SUMMARY'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers size={14} />
            Event Overview
          </button>
          <button
            onClick={() => setActiveTab('METADATA')}
            className={`flex items-center gap-1.5 py-3 px-2 text-xs font-bold border-b-2 transition-all mr-4 ${
              activeTab === 'METADATA'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileCode size={14} />
            Changes & Metadata
          </button>
          <button
            onClick={() => setActiveTab('RAW')}
            className={`flex items-center gap-1.5 py-3 px-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'RAW'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Code2 size={14} />
            Raw Payload JSON
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'SUMMARY' && (
            <div className="space-y-4 text-xs">
              {/* Target Entity Card */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Tag size={13} className="text-[#ff8a5c]" />
                    Target Entity ({auditLog.entityType})
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEntityId}
                    className="flex items-center gap-1 font-semibold text-[#ff8a5c] hover:underline"
                  >
                    {copiedEntityId ? (
                      <>
                        <Check size={12} className="text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy UUID
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-gray-800 select-all p-2 rounded bg-white border border-gray-200">
                  {auditLog.entityId}
                </p>
              </div>

              {/* Grid of Actors & Network Forensics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[11px] mb-1">Triggering Actor</span>
                  <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <User size={13} className="text-indigo-500 shrink-0" />
                    <span className="font-mono truncate">{auditLog.actorId || 'SYSTEM (Automated)'}</span>
                    {auditLog.actorId && (
                      <button
                        type="button"
                        onClick={handleCopyActorId}
                        className="text-gray-400 hover:text-[#ff8a5c] ml-1"
                        title="Copy Actor ID"
                      >
                        {copiedActorId ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[11px] mb-1">Timestamp</span>
                  <div className="font-medium text-gray-800 flex items-center gap-1.5">
                    <Calendar size={13} className="text-gray-500 shrink-0" />
                    <span>{new Date(auditLog.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[11px] mb-1">Origin IP Address</span>
                  <div className="font-mono font-medium text-gray-800 flex items-center gap-1.5">
                    <Globe size={13} className="text-gray-400 shrink-0" />
                    <span>{auditLog.ipAddress || 'Internal / Cloudflare Worker'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[11px] mb-1">Assigned Tenant</span>
                  <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <Building2 size={13} className="text-blue-500 shrink-0" />
                    <span className="truncate">
                      {auditLog.institution?.name || (auditLog.institutionId ? auditLog.institutionId : 'Global Platform Scope')}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Agent Forensics */}
              {auditLog.userAgent && (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5 mb-1">
                    <Monitor size={13} className="text-gray-500" />
                    Client User Agent
                  </span>
                  <p className="font-mono text-[11px] text-gray-600 p-2 rounded bg-white border border-gray-200 break-all select-all">
                    {auditLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'METADATA' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Detailed state mutation payload captured at event creation</span>
                <span className="font-mono text-[11px]">
                  {Object.keys(auditLog.metadata || {}).length} attributes
                </span>
              </div>

              {Object.keys(auditLog.metadata || {}).length === 0 ? (
                <div className="p-6 text-center text-gray-400 border rounded-xl bg-gray-50">
                  No additional metadata recorded for this event.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 font-bold text-gray-500 text-[11px]">
                        <th className="py-2 px-3">Field / Attribute</th>
                        <th className="py-2 px-3">Recorded Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                      {Object.entries(auditLog.metadata).map(([key, value]) => (
                        <tr key={key} className="hover:bg-gray-50">
                          <td className="py-2 px-3 font-semibold text-gray-700">{key}</td>
                          <td className="py-2 px-3 text-gray-800 break-all">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'RAW' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Database Record Payload</span>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 text-xs font-semibold text-[#ff8a5c] hover:underline"
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
              <pre className="p-4 rounded-xl bg-gray-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[350px]">
                {JSON.stringify(auditLog, null, 2)}
              </pre>
            </div>
          )}
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

