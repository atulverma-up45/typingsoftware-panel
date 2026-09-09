import React from 'react';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  RotateCcw,
  Sliders,
  Sparkles,
  Code2,
  Lock,
} from 'lucide-react';
import type { TypingModule } from '../api/moduleApi';
import StatusBadge from '@/components/ui/StatusBadge';
import { usePermissions } from '@/lib/permissions';

interface ModuleCardProps {
  module: TypingModule;
  onEdit: (module: TypingModule) => void;
  onToggleStatus: (module: TypingModule) => void;
  onViewDetails: (module: TypingModule) => void;
  onConfigureOverride?: (module: TypingModule) => void;
  onDelete: (module: TypingModule) => void;
  onRestore?: (module: TypingModule) => void;
  isDeletedView?: boolean;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  onEdit,
  onToggleStatus,
  onViewDetails,
  onConfigureOverride,
  onDelete,
  onRestore,
  isDeletedView = false,
}) => {
  const { isSuperAdmin, isAdmin } = usePermissions();
  const isActive = module.status === 'ACTIVE';
  const configKeys = Object.keys(module.configuration || {});

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-white p-6 shadow-sm hover:shadow-md ${
        !isActive || isDeletedView
          ? 'border-gray-200 opacity-85 bg-gray-50/50'
          : 'border-gray-200 hover:border-primary/50'
      }`}
    >
      <div>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary flex items-center justify-center shrink-0">
              <Layers size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 tracking-tight">{module.name}</h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                  v{module.version}
                </span>
              </div>
              <p className="font-mono text-xs text-gray-400 mt-0.5">{module.key}</p>
            </div>
          </div>

          <div>
            <StatusBadge
              status={isDeletedView ? 'TRASH' : module.status}
              size="sm"
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed min-h-[2rem]">
          {module.description || 'No detailed documentation provided for this typing module.'}
        </p>

        {/* Config Summary Pill */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Code2 size={13} className="text-gray-400" />
            Config Parameters: <strong className="text-gray-800">{configKeys.length}</strong>
          </span>
          <span className="text-[11px] text-gray-400">
            Created {new Date(module.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(module)}
          className="h-[36px] px-3 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors inline-flex items-center justify-center shadow-2xs"
        >
          View Specs
        </button>

        {!isSuperAdmin ? (
          <div className="flex items-center flex-wrap gap-1.5">
            {isAdmin && onConfigureOverride && !isDeletedView && (
              <button
                type="button"
                onClick={() => onConfigureOverride(module)}
                className="h-[36px] px-2.5 flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors shadow-2xs"
                title="Configure Lab Overrides"
              >
                <Sliders size={13} />
                Overrides
              </button>
            )}
            <div
              title="Typing modules are core system engines centrally managed by Super Admin. Read-only for institutions."
              className="h-[36px] px-3 flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-50 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed select-none pointer-events-none"
            >
              <Lock size={12} className="text-gray-400" />
              <span>Read-Only</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center flex-wrap gap-1.5">
            {isDeletedView ? (
              <>
                {onRestore && (
                  <button
                    type="button"
                    onClick={() => onRestore(module)}
                    className="h-[36px] px-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition-colors shadow-2xs"
                    title="Restore module"
                  >
                    <RotateCcw size={13} />
                    Restore
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(module)}
                  className="h-[36px] px-3 flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors shadow-2xs"
                  title="Permanent purge"
                >
                  <Trash2 size={13} />
                  Purge
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onToggleStatus(module)}
                  className={`h-[36px] px-3 text-xs font-semibold rounded-xl border transition-colors inline-flex items-center justify-center shadow-2xs ${
                    isActive
                      ? 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title={isActive ? 'Deactivate module' : 'Activate module'}
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(module)}
                  className="h-[36px] px-3 flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary-100 hover:bg-[#ffe2d6] rounded-xl border border-primary/20 transition-colors shadow-2xs"
                  title="Edit module"
                >
                  <Edit3 size={13} />
                  Edit
                </button>
                {onConfigureOverride && (
                  <button
                    type="button"
                    onClick={() => onConfigureOverride(module)}
                    className="h-[36px] px-2.5 flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors shadow-2xs"
                    title="Tenant Overrides"
                  >
                    <Sliders size={13} />
                    Overrides
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(module)}
                  className="h-[36px] w-[36px] flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-colors shrink-0"
                  title="Move to trash"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

