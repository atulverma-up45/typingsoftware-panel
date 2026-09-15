import React from 'react';
import { User, Building2, Globe, Clock, Eye, Copy, Check } from 'lucide-react';
import type { AuditLog } from '../api/auditApi';
import { AuditActionBadge } from './AuditActionBadge';

interface AuditTableViewProps {
  logs: AuditLog[];
  copiedId: string | null;
  onCopy: (id: string, text: string, e: React.MouseEvent) => void;
  onInspect: (log: AuditLog) => void;
}

export const AuditTableView: React.FC<AuditTableViewProps> = ({
  logs,
  copiedId,
  onCopy,
  onInspect,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <th scope="col" className="py-3 px-4">Action</th>
            <th scope="col" className="py-3 px-4">Target Entity</th>
            <th scope="col" className="py-3 px-4">Actor</th>
            <th scope="col" className="py-3 px-4">Tenant Scope</th>
            <th scope="col" className="py-3 px-4">Origin IP</th>
            <th scope="col" className="py-3 px-4">Timestamp</th>
            <th scope="col" className="py-3 px-4 text-right">Inspect</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-xs">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
              {/* Action */}
              <td className="py-3 px-4"><AuditActionBadge action={log.action} /></td>

              {/* Target Entity */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-800 text-[11px]">
                    {log.entityType}:
                  </span>
                  <span className="font-mono text-gray-500 text-[11px] truncate max-w-[130px]">
                    {log.entityId}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => onCopy(`ent_${log.id}`, log.entityId, e)}
                    className="text-gray-400 hover:text-primary shrink-0"
                    title="Copy Entity ID"
                  >
                    {copiedId === `ent_${log.id}` ? (
                      <Check size={11} className="text-emerald-600" />
                    ) : (
                      <Copy size={11} />
                    )}
                  </button>
                </div>
              </td>

              {/* Actor */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <User size={13} className="text-gray-400 shrink-0" />
                  <span className="truncate max-w-[130px] font-medium">
                    {log.actor?.name || log.actorId || 'SYSTEM'}
                  </span>
                </div>
              </td>

              {/* Tenant Scope */}
              <td className="py-3 px-4 text-gray-600">
                {log.institution ? (
                  <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                    <Building2 size={13} className="text-blue-500 shrink-0" />
                    <span className="truncate font-medium">{log.institution.name}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400 italic">Global Platform</span>
                )}
              </td>

              {/* IP Address */}
              <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                <div className="flex items-center gap-1">
                  <Globe size={12} className="text-gray-400 shrink-0" />
                  <span className="truncate max-w-[120px]">
                    {log.ipAddress || 'Internal'}
                  </span>
                </div>
              </td>

              {/* Timestamp */}
              <td className="py-3 px-4 text-gray-500">
                <div className="flex items-center gap-1 text-[11px]">
                  <Clock size={12} className="text-gray-400 shrink-0" />
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </td>

              {/* Action */}
              <td className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => onInspect(log)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="View forensic details"
                >
                  <Eye size={13} />
                  Inspect
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

