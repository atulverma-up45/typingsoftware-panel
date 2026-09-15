import React from 'react';
import { Laptop, Activity, Sliders, Calendar, Eye, Copy, Check } from 'lucide-react';
import type { SyncOperation } from '../api/syncApi';
import { OperationBadge } from './OperationBadge';

interface SyncCardProps {
  operation: SyncOperation;
  copiedId: string | null;
  isCardsGrid: boolean;
  onCopy: (id: string, text: string, e: React.MouseEvent) => void;
  onInspect: (op: SyncOperation) => void;
}

export const SyncCard: React.FC<SyncCardProps> = ({
  operation: op,
  copiedId,
  isCardsGrid,
  onCopy,
  onInspect,
}) => {
  return (
    <div
      onClick={() => onInspect(op)}
      className={`p-4 space-y-2.5 hover:bg-gray-50/70 transition-colors cursor-pointer ${
        isCardsGrid ? 'bg-white rounded-2xl border border-gray-200 shadow-2xs' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Laptop size={16} className="text-primary shrink-0" />
          <span className="font-mono font-bold text-gray-900 text-xs truncate">
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
        <OperationBadge operation={op.operation} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 block">
            Entity
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            {op.entityType === 'DEVICE_ACTIVITY' ? (
              <Activity size={12} className="text-primary" />
            ) : (
              <Sliders size={12} className="text-purple-500" />
            )}
            <span className="font-semibold text-gray-800 text-[11px] truncate block">
              {op.entityType}
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 block">
            Institution
          </span>
          <span className="text-gray-700 text-[11px] truncate block mt-0.5">
            {op.institution?.name || op.institutionId}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
        <div className="flex items-center gap-1 text-gray-400">
          <Calendar size={12} />
          <span>
            {new Date(op.processedAt).toLocaleString([], {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInspect(op);
          }}
          className="text-primary font-bold inline-flex items-center gap-1 hover:underline"
        >
          <Eye size={12} /> Inspect
        </button>
      </div>
    </div>
  );
};

