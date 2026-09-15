import React from 'react';
import { Calendar, Laptop, RotateCw } from 'lucide-react';
import type { Subscription } from '../api/subscriptionApi';
import StatusBadge from '@/components/ui/StatusBadge';
import { SubscriptionCard } from './SubscriptionCard';
import { SubscriptionActionsDropdown } from './SubscriptionActionsDropdown';

export interface SubscriptionTableViewProps {
  subscriptions: Subscription[];
  now: Date;
  activeTab: string;
  viewMode: 'TABLE' | 'CARDS';
  onViewDetails: (sub: Subscription) => void;
  onRenew: (sub: Subscription) => void;
  onEdit: (sub: Subscription) => void;
  onChangeStatus: (sub: Subscription) => void;
  onDelete: (sub: Subscription) => void;
  onRestore?: (sub: Subscription) => void;
}

export const SubscriptionTableView: React.FC<SubscriptionTableViewProps> = ({
  subscriptions,
  now,
  activeTab,
  viewMode,
  onViewDetails,
  onRenew,
  onEdit,
  onChangeStatus,
  onDelete,
  onRestore,
}) => {
  if (viewMode === 'CARDS') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {subscriptions.map((sub) => (
          <SubscriptionCard
            key={sub.id}
            subscription={sub}
            now={now}
            activeTab={activeTab}
            onViewDetails={onViewDetails}
            onRenew={onRenew}
            onEdit={onEdit}
            onChangeStatus={onChangeStatus}
            onDelete={onDelete}
            onRestore={onRestore}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
      {/* Mobile Card View (< md screens) */}
      <div className="md:hidden divide-y divide-gray-100">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="p-4 hover:bg-gray-50/50 transition-colors">
            <SubscriptionCard
              subscription={sub}
              now={now}
              activeTab={activeTab}
              onViewDetails={onViewDetails}
              onRenew={onRenew}
              onEdit={onEdit}
              onChangeStatus={onChangeStatus}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          </div>
        ))}
      </div>

      {/* Desktop Table (md+ screens) */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-4">Customer Institution</th>
              <th className="py-3 px-4">Commercial Tier</th>
              <th className="py-3 px-4">Contract Period</th>
              <th className="py-3 px-4">Seat Allocation</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {subscriptions.map((sub) => {
              const expiryDate = new Date(sub.expiresAt);
              const startDate = new Date(sub.startsAt);
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
                <tr key={sub.id} className="hover:bg-gray-50/70 transition-colors">
                  {/* Customer Column */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-orange-100">
                        {sub.institution?.name?.slice(0, 2).toUpperCase() || 'IN'}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">
                          {sub.institution?.name || sub.institutionId}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                          <span>/{sub.institution?.slug || 'tenant'}</span>
                          <span>•</span>
                          <span className="font-mono">{sub.id}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Tier Column */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-gray-900 block">
                      {sub.plan?.name || sub.planId}
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      ₹{((sub.plan?.price || 0) / 100).toLocaleString('en-IN')} / {sub.plan?.durationDays || 365}d
                    </span>
                  </td>

                  {/* Period Column */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400 shrink-0" />
                      <span className="text-gray-800">
                        {startDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                        })}{' '}
                        -{' '}
                        {expiryDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="mt-1">
                      {isExpired ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Expired {Math.abs(diffDays)}d ago
                        </span>
                      ) : isExpiringSoon ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Expiring in {diffDays}d
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {diffDays} days left
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Seat Allocation Column */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                      <Laptop size={14} className="text-primary" />
                      <span>
                        <strong>{totalActive}</strong> / {totalCapacity || sub.plan?.maxActivations || 5} PCs
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      {licenses.length} {licenses.length === 1 ? 'License' : 'Licenses'} Issued
                    </span>
                  </td>

                  {/* Status Column */}
                  <td className="py-3.5 px-4">
                    <StatusBadge
                      status={sub.deletedAt ? 'TRASH' : sub.status}
                      size="sm"
                    />
                    {sub.autoRenew && !sub.deletedAt && (
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        Auto-Renew On
                      </span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!sub.deletedAt && (isExpiringSoon || isExpired) && (
                        <button
                          type="button"
                          onClick={() => onRenew(sub)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-primary bg-primary-100 hover:bg-primary-200 rounded-lg border border-primary/30 transition-colors shadow-2xs cursor-pointer"
                          title="Quick Renew Contract"
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

