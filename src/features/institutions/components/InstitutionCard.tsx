import React from 'react';
import { Copy, Check, Mail } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { InstitutionActionsDropdown } from './InstitutionActionsDropdown';
import type { Institution } from '../api/institutionApi';

interface InstitutionCardProps {
  institution: Institution;
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

export const InstitutionCard: React.FC<InstitutionCardProps> = ({
  institution: inst,
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
  const isDeleted = !!inst.deletedAt;

  return (
    <div
      key={inst.id}
      className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 ${
        isDeleted ? 'opacity-65 bg-gray-50/40' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center border border-gray-200 shrink-0">
            {inst.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4
              className="font-semibold text-gray-900 text-sm hover:text-primary transition-colors truncate cursor-pointer"
              onClick={() => onView(inst)}
            >
              {inst.name}
            </h4>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-gray-400 text-[11px]">@{inst.slug}</span>
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

        <div className="shrink-0">
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
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-50 text-xs">
        {isDeleted ? (
          <StatusBadge status="DELETED" size="sm" />
        ) : (
          <StatusBadge status={inst.status} size="sm" />
        )}
        <span className="text-[11px] text-gray-400">
          {new Date(inst.createdAt).toLocaleDateString()}
        </span>
      </div>

      {inst.email && (
        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100 bg-gray-50/50 -mx-4 -mb-4 p-2.5 rounded-b-2xl truncate">
          <a
            href={`mailto:${inst.email}`}
            className="hover:text-primary flex items-center gap-1.5 truncate"
          >
            <Mail size={12} className="text-gray-400 shrink-0" />
            <span className="truncate">{inst.email}</span>
          </a>
          {inst.phone && <span className="text-gray-400 shrink-0">{inst.phone}</span>}
        </div>
      )}
    </div>
  );
};

