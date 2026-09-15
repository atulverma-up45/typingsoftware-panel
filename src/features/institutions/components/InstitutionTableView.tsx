import React from 'react';
import { Copy, Check, Mail } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { InstitutionActionsDropdown } from './InstitutionActionsDropdown';
import type { Institution } from '../api/institutionApi';

interface InstitutionTableViewProps {
  institutions: Institution[];
  isSuperAdmin: boolean;
  copiedId: string | null;
  onCopySlug: (slug: string) => void;
  onView: (inst: Institution) => void;
  onEdit: (inst: Institution) => void;
  onBranding: (inst: Institution) => void;
  onChangeStatus: (inst: Institution) => void;
  onSoftDelete: (inst: Institution) => void;
  onRestore: (inst: Institution) => void;
  onPermanentDelete: (inst: Institution) => void;
}

export const InstitutionTableView: React.FC<InstitutionTableViewProps> = ({
  institutions,
  isSuperAdmin,
  copiedId,
  onCopySlug,
  onView,
  onEdit,
  onBranding,
  onChangeStatus,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
}) => {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <th scope="col" className="py-3.5 px-6">Center & Tenant Slug</th>
          <th scope="col" className="py-3.5 px-6">Official Contact</th>
          <th scope="col" className="py-3.5 px-6">Operational Status</th>
          <th scope="col" className="py-3.5 px-6">Onboarded</th>
          <th scope="col" className="py-3.5 px-6 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
        {institutions.map((inst) => {
          const isDeleted = !!inst.deletedAt;

          return (
            <tr
              key={inst.id}
              className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
              onClick={() => onView(inst)}
            >
              {/* Name & Slug */}
              <td className="py-3.5 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center border border-gray-200 group-hover:border-primary/40 group-hover:bg-primary-100 group-hover:text-primary transition-all shrink-0">
                    {inst.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                      <span>{inst.name}</span>
                      {inst.phone && (
                        <span className="text-[10px] text-gray-400 hidden sm:inline">
                          • {inst.phone}
                        </span>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1.5 mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-mono text-gray-400 text-[11px]">
                        @{inst.slug}
                      </span>
                      <button
                        type="button"
                        onClick={() => onCopySlug(inst.slug)}
                        className="text-gray-300 hover:text-gray-600 p-0.5 rounded transition-colors"
                        title="Copy slug"
                      >
                        {copiedId === inst.slug ? (
                          <Check size={11} className="text-emerald-600" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </td>

              {/* Contact */}
              <td className="py-3.5 px-6" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-1">
                  <a
                    href={`mailto:${inst.email}`}
                    className="text-gray-800 font-medium hover:text-primary flex items-center gap-1.5 transition-colors truncate max-w-[200px]"
                  >
                    <Mail size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{inst.email}</span>
                  </a>
                  {inst.address && (
                    <div className="text-[11px] text-gray-400 truncate max-w-[220px]">
                      {inst.address}
                    </div>
                  )}
                </div>
              </td>

              {/* Status */}
              <td className="py-3.5 px-6">
                {isDeleted ? (
                  <StatusBadge status="DELETED" size="sm" />
                ) : (
                  <StatusBadge status={inst.status} size="sm" />
                )}
              </td>

              {/* Onboarded Date */}
              <td className="py-3.5 px-6 text-gray-500 text-[11px]">
                {new Date(inst.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>

              {/* Actions */}
              <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                <InstitutionActionsDropdown
                  institution={inst}
                  isSuperAdmin={isSuperAdmin}
                  onView={onView}
                  onEdit={onEdit}
                  onBranding={onBranding}
                  onChangeStatus={onChangeStatus}
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
  );
};

