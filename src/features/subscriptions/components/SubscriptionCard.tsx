import React from 'react';
import { Calendar, Laptop, RotateCw } from 'lucide-react';
import type { Subscription } from '../api/subscriptionApi';
import StatusBadge from '@/components/ui/StatusBadge';
import { SubscriptionActionsDropdown } from './SubscriptionActionsDropdown';

export interface SubscriptionCardProps {
  subscription: Subscription;
  now: Date;
  activeTab: string;
  onViewDetails: (sub: Subscription) => void;
  onRenew: (sub: Subscription) => void;
  onEdit: (sub: Subscription) => void;
  onChangeStatus: (sub: Subscription) => void;
  onDelete: (sub: Subscription) => void;
  onRestore?: (sub: Subscription) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription: sub,
  now,
  activeTab,
  onViewDetails,
  onRenew,
  onEdit,
  onChangeStatus,
  onDelete,
  onRestore,
}) => {
  const expiryDate = new Date(sub.expiresAt);
  const diffDays = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = diffDays <= 0;
  const isExpiringSoon = diffDays > 0 && diffDays <= 30;

  const licenses = sub.licenses || [];
  const totalCapacity = licenses.reduce(
    (sum, lic) => sum + (lic.maxActivations || 0),
    0
  );
  const totalActive = licenses.reduce(
    (sum, lic) =>
      sum +
      ((lic.activations || []).filter((a: { status: string }) => a.status === 'ACTIVE').length || 0),
    0
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-orange-100">
              {sub.institution?.name?.slice(0, 2).toUpperCase() || 'IN'}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-gray-900 text-sm block truncate">
                {sub.institution?.name || sub.institutionId}
              </span>
              <span className="text-[11px] text-gray-400 font-mono block truncate">
                {sub.id}
              </span>
            </div>
          </div>
          <StatusBadge status={sub.deletedAt ? 'TRASH' : sub.status} size="sm" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 mb-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Tier</span>
            <span className="font-semibold text-gray-800">{sub.plan?.name || sub.planId}</span>
            <span className="text-[10px] text-gray-500 block">
              ₹{((sub.plan?.price || 0) / 100).toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Seat Usage</span>
            <div className="flex items-center gap-1 font-semibold text-gray-800">
              <Laptop size={12} className="text-primary" />
              <span>{totalActive} / {totalCapacity || sub.plan?.maxActivations || 5} PCs</span>
            </div>
            <span className="text-[10px] text-gray-400 block">
              {licenses.length} {licenses.length === 1 ? 'License' : 'Licenses'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Calendar size={13} className="text-gray-400" />
            <span>
              Expires {expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
            </span>
          </div>
          <div>
            {isExpired ? (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Expired
              </span>
            ) : isExpiringSoon ? (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {diffDays}d left
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                {diffDays}d left
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100/80">
        {!sub.deletedAt && (isExpiringSoon || isExpired) && (
          <button
            type="button"
            onClick={() => onRenew(sub)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary bg-primary-100 hover:bg-primary-200 rounded-xl border border-primary/30 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCw size={12} />
            Renew
          </button>
        )}
        <SubscriptionActionsDropdown
          subscription={sub}
          onViewDetails={onViewDetails}
          onRenew={onRenew}
          onEdit={onEdit}
          onChangeStatus={onChangeStatus}
          onDelete={onDelete}
          onRestore={onRestore}
          isDeletedView={activeTab === 'TRASH'}
        />
      </div>
    </div>
  );
};

