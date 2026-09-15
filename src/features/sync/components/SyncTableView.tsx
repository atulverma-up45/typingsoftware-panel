import React from 'react';
import { Laptop, Activity, Sliders, Building2, Calendar, Eye, Copy, Check } from 'lucide-react';
import type { SyncOperation } from '../api/syncApi';
import { OperationBadge } from './OperationBadge';

interface SyncTableViewProps {
  operations: SyncOperation[];
  copiedId: string | null;
  onCopy: (id: string, text: string, e: React.MouseEvent) => void;
  onInspect: (op: SyncOperation) => void;
}

export const SyncTableView: React.FC<SyncTableViewProps> = ({
  operations,
  copiedId,
  onCopy,
  onInspect,
}) => {
  return (
    <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th scope="col" className="py-3 px-4">Device ID</th>
              <th scope="col" className="py-3 px-4">Entity Type</th>
              <th scope="col" className="py-3 px-4">Operation</th>
              <th scope="col" className="py-3 px-4">Idempotency Key</th>
              <th scope="col" className="py-3 px-4">Institution Scope</th>
              <th scope="col" className="py-3 px-4">Processed Timestamp</th>
              <th scope="col" className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {operations.map((op) => (
              <tr key={op.id} className="hover:bg-gray-50/70 transition-colors">
                {/* Device ID */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Laptop size={15} className="text-gray-400 shrink-0" />
                    <span className="font-mono font-semibold text-gray-800">
                      {op.deviceId}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => onCopy(`dev_${op.id}`, op.deviceId, e)}
                      className="text-gray-400 hover:text-primary"
                      title="Copy Device ID"
                    >
                      {copiedId === `dev_${op.id}` ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </td>

                {/* Entity Type */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 font-medium text-gray-700">
                    {op.entityType === 'DEVICE_ACTIVITY' ? (
                      <Activity size={13} className="text-primary" />
                    ) : (
                      <Sliders size={13} className="text-purple-500" />
                    )}
                    <span>{op.entityType}</span>
                  </div>
                </td>

                {/* Operation */}
                <td className="py-3 px-4">
                  <OperationBadge operation={op.operation} />
                </td>

                {/* Idempotency Key */}
                <td className="py-3 px-4 font-mono text-[11px] text-gray-500 max-w-[180px] truncate">
                  <div className="flex items-center gap-1">
                    <span className="truncate">{op.idempotencyKey}</span>
                    <button
                      type="button"
                      onClick={(e) => onCopy(`key_${op.id}`, op.idempotencyKey, e)}
                      className="text-gray-400 hover:text-primary shrink-0"
                      title="Copy Idempotency Key"
                    >
                      {copiedId === `key_${op.id}` ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </td>

                {/* Institution */}
                <td className="py-3 px-4 text-gray-600">
                  {op.institution ? (
                    <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                      <Building2 size={13} className="text-blue-500 shrink-0" />
                      <span className="truncate font-medium">{op.institution.name}</span>
                    </div>
                  ) : (
                    <span className="font-mono text-[11px] text-gray-400">
                      {op.institutionId}
                    </span>
                  )}
                </td>

                {/* Processed Timestamp */}
                <td className="py-3 px-4 text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-gray-400 shrink-0" />
                    <span>{new Date(op.processedAt).toLocaleString()}</span>
                  </div>
                </td>

                {/* Action */}
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => onInspect(op)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    title="View sync record forensics"
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
    </div>
  );
};

