import React from 'react';
import { Shield, Plus, Check, Copy, Clock } from 'lucide-react';
import type { License } from '../api/licenseApi';
import ResponsiveDataView from '@/components/ui/ResponsiveDataView';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { LicenseCard } from './LicenseCard';
import { LicenseActionsDropdown } from './LicenseActionsDropdown';

export interface LicenseTableViewProps {
  licensesList: License[];
  isLoadingLicenses: boolean;
  isErrorLicenses: boolean;
  licensesError: unknown;
  refetchLicenses: () => void;
  viewMode: 'TABLE' | 'CARDS';
  searchTerm: string;
  activeTab: string;
  isSupport: boolean;
  isSuperAdmin: boolean;
  isAllKeysMasked: boolean;
  copiedKey: string | null;
  onCopyKey: (key: string) => void;
  onGenerateKey: () => void;
  onView: (target: License) => void;
  onEdit: (target: License) => void;
  onChangeStatus: (target: License) => void;
  onRevoke: (target: License) => void;
  onSoftDelete: (target: License) => void;
  onRestore: (target: License) => void;
  onPermanentDelete: (target: License) => void;
}

export const LicenseTableView: React.FC<LicenseTableViewProps> = ({
  licensesList,
  isLoadingLicenses,
  isErrorLicenses,
  licensesError,
  refetchLicenses,
  viewMode,
  searchTerm,
  activeTab,
  isSupport,
  isSuperAdmin,
  isAllKeysMasked,
  copiedKey,
  onCopyKey,
  onGenerateKey,
  onView,
  onEdit,
  onChangeStatus,
  onRevoke,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
}) => {
  return (
    <ResponsiveDataView<License>
      items={licensesList}
      isLoading={isLoadingLicenses}
      isError={isErrorLicenses}
      errorMessage={(licensesError as Error)?.message}
      onRetry={refetchLicenses}
      viewMode={viewMode}
      keyExtractor={(lic) => lic.id}
      cardGridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-3.5 sm:p-4"
      emptyState={
        <EmptyState
          icon={<Shield size={28} />}
          title="No licenses found"
          description={
            searchTerm
              ? `No workstation licenses matched "${searchTerm}".`
              : activeTab === 'TRASH'
              ? 'Recycle bin is completely empty.'
              : 'Get started by generating your first cryptographic workstation key.'
          }
          action={
            !searchTerm && activeTab !== 'TRASH' && !isSupport ? (
              <button
                type="button"
                onClick={onGenerateKey}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} />
                <span>Generate Key</span>
              </button>
            ) : undefined
          }
        />
      }
      renderCard={(lic) => (
        <LicenseCard
          key={lic.id}
          license={lic}
          isAllKeysMasked={isAllKeysMasked}
          copiedKey={copiedKey}
          onCopyKey={onCopyKey}
          isSuperAdmin={isSuperAdmin}
          onView={onView}
          onEdit={onEdit}
          onChangeStatus={onChangeStatus}
          onRevoke={onRevoke}
          onSoftDelete={onSoftDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      )}
      renderTable={(items) => (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-3.5 px-6">License Key & Credentials</th>
              <th className="py-3.5 px-6">Tenant Institution</th>
              <th className="py-3.5 px-6">Seat Saturation</th>
              <th className="py-3.5 px-6">Offline Grace</th>
              <th className="py-3.5 px-6">Status & Expiration</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
            {items.map((lic) => {
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
                <tr
                  key={lic.id}
                  className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                  onClick={() => onView(lic)}
                >
                  <td className="py-3.5 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                          {isMasked ? `${lic.licenseKey.substring(0, 8)}••••••••••••` : lic.licenseKey}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyKey(lic.licenseKey);
                          }}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors cursor-pointer"
                          title="Copy Key"
                        >
                          {copiedKey === lic.licenseKey ? (
                            <Check size={14} className="text-emerald-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        Minted: {new Date(lic.issuedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-gray-900">
                        {lic.institution?.name || 'Assigned Center'}
                      </div>
                      {lic.institution?.slug && (
                        <div className="text-[11px] font-mono text-gray-400">
                          @{lic.institution.slug}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="space-y-1.5 min-w-[120px]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-gray-800">
                          {activationsCount} / {maxSeats} Seats
                        </span>
                        <span className="text-gray-400 font-medium">{seatRatio}%</span>
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
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                      <Clock size={11} className="text-gray-400" />
                      <span>{lic.offlineGraceDays}d allowed</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="space-y-1">
                      {isDeleted ? (
                        <StatusBadge status="DELETED" size="sm" />
                      ) : isExpired ? (
                        <StatusBadge status="EXPIRED" size="sm" />
                      ) : (
                        <StatusBadge status={lic.status} size="sm" />
                      )}
                      <div className="text-[10px] text-gray-400">
                        {isExpired ? (
                          <span className="text-rose-600 font-medium">Expired</span>
                        ) : daysUntilExpiry <= 30 ? (
                          <span className="text-amber-600 font-medium">
                            Expires in {daysUntilExpiry}d
                          </span>
                        ) : (
                          <span>Expires {new Date(lic.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    />
  );
};

