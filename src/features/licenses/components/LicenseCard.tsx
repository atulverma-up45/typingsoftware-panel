import React from 'react';
import { Copy, Check, Clock } from 'lucide-react';
import type { License } from '../api/licenseApi';
import StatusBadge from '@/components/ui/StatusBadge';
import { LicenseActionsDropdown } from './LicenseActionsDropdown';

export interface LicenseCardProps {
  license: License;
  isAllKeysMasked: boolean;
  copiedKey: string | null;
  onCopyKey: (key: string) => void;
  isSuperAdmin: boolean;
  onView: (target: License) => void;
  onEdit: (target: License) => void;
  onChangeStatus: (target: License) => void;
  onRevoke: (target: License) => void;
  onSoftDelete: (target: License) => void;
  onRestore: (target: License) => void;
  onPermanentDelete: (target: License) => void;
}

export const LicenseCard: React.FC<LicenseCardProps> = ({
  license: lic,
  isAllKeysMasked,
  copiedKey,
  onCopyKey,
  isSuperAdmin,
  onView,
  onEdit,
  onChangeStatus,
  onRevoke,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
}) => {
  const isDeleted = !!lic.deletedAt;
  const isMasked = isAllKeysMasked;
  const activationsCount = lic.activations?.length || 0;
  const maxSeats = lic.maxActivations || 1;
  const seatRatio = Math.round((activationsCount / maxSeats) * 100);
  const now = new Date().getTime();
  const expTime = new Date(lic.expiresAt).getTime();
  const isExpired = expTime <= now;
  const daysUntilExpiry = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 ${
        isDeleted ? 'opacity-65 bg-gray-50/40' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs sm:text-[13px] font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200/80 truncate block">
              {isMasked ? `${lic.licenseKey.substring(0, 8)}••••••••••••` : lic.licenseKey}
            </span>
            <button
              type="button"
              onClick={() => onCopyKey(lic.licenseKey)}
              className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
              title="Copy license key"
            >
              {copiedKey === lic.licenseKey ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
          {lic.institution?.name && (
            <p className="text-xs text-gray-500 font-medium mt-1 truncate">
              {lic.institution.name}
            </p>
          )}
        </div>

        <div className="shrink-0">
          <LicenseActionsDropdown
            license={lic}
            isSuperAdmin={isSuperAdmin}
            onView={onView}
            onEdit={onEdit}
            onChangeStatus={onChangeStatus}
            onRevoke={onRevoke}
            onSoftDelete={onSoftDelete}
            onRestore={onRestore}
            onPermanentDelete={onPermanentDelete}
          />
        </div>
      </div>

      <div className="space-y-1 bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-gray-700">
            {activationsCount} / {maxSeats} Seats
          </span>
          <span className="text-gray-400 font-medium">{seatRatio}% capacity</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              seatRatio >= 100
                ? 'bg-purple-600'
                : seatRatio >= 75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${seatRatio}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-50 text-xs">
        {isDeleted ? (
          <StatusBadge status="DELETED" size="sm" />
        ) : isExpired ? (
          <StatusBadge status="EXPIRED" size="sm" />
        ) : (
          <StatusBadge status={lic.status} size="sm" />
        )}

        <div className="text-[11px] text-gray-500 flex items-center gap-1">
          <Clock size={12} className="text-gray-400" />
          {isExpired ? (
            <span className="text-rose-600 font-semibold">Expired</span>
          ) : daysUntilExpiry <= 30 ? (
            <span className="text-amber-600 font-semibold">Expires in {daysUntilExpiry}d</span>
          ) : (
            <span>Expires {new Date(lic.expiresAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

