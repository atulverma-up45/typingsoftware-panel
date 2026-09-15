import React from 'react';
import { Clock, Building2, Eye, Copy, Check } from 'lucide-react';
import type { AuditLog } from '../api/auditApi';
import { AuditActionBadge } from './AuditActionBadge';

interface AuditLogCardProps {
  log: AuditLog;
  copiedId: string | null;
  onCopy: (id: string, text: string, e: React.MouseEvent) => void;
  onInspect: (log: AuditLog) => void;
}

export const AuditLogCard: React.FC<AuditLogCardProps> = ({
  log,
  copiedId,
  onCopy,
  onInspect,
}) => {
  return (
    <div
      onClick={() => onInspect(log)}
      className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div><AuditActionBadge action={log.action} /></div>
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <Clock size={11} />
          <span>
            {new Date(log.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-[11px]">Entity</span>
          <div className="flex items-center gap-1">
            <span className="font-bold text-gray-800 text-[11px]">
              {log.entityType}:
            </span>
            <span className="font-mono text-gray-600 text-[11px] max-w-[120px] truncate">
              {log.entityId}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(`ent_${log.id}`, log.entityId, e);
              }}
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
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-[11px]">Actor</span>
          <span className="font-semibold text-gray-800 truncate max-w-[140px]">
            {log.actor?.name || log.actorId || 'SYSTEM'}
          </span>
        </div>

        {log.institution && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[11px]">Tenant</span>
            <span className="text-blue-600 font-medium truncate max-w-[140px] flex items-center gap-1">
              <Building2 size={11} />
              {log.institution.name}
            </span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
        <span className="font-mono text-[10px] text-gray-400">
          {log.ipAddress || 'Internal IP'}
        </span>
        <span className="text-primary font-bold inline-flex items-center gap-1">
          <Eye size={12} /> Inspect
        </span>
      </div>
    </div>
  );
};

