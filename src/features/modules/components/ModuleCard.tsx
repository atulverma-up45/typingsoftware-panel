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
} from 'lucide-react';
import type { TypingModule } from '../api/moduleApi';

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
  const isActive = module.status === 'ACTIVE';
  const configKeys = Object.keys(module.configuration || {});

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-white p-6 shadow-sm hover:shadow-md ${
        !isActive || isDeletedView
          ? 'border-gray-200 opacity-85 bg-gray-50/50'
          : 'border-gray-200 hover:border-[#ff8a5c]/50'
      }`}
    >
      <div>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center shrink-0">
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
            {isDeletedView ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                In Trash
              </span>
            ) : isActive ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                Inactive
              </span>
            )}
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
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(module)}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          View Specs
        </button>

        <div className="flex items-center gap-1.5">
          {isDeletedView ? (
            <>
              {onRestore && (
                <button
                  type="button"
                  onClick={() => onRestore(module)}
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                  title="Restore module"
                >
                  <RotateCcw size={13} />
                  Restore
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(module)}
                className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors"
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
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
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
                className="flex items-center gap-1 text-xs font-medium text-[#ff8a5c] bg-[#fff0eb] hover:bg-[#ffe2d6] px-2.5 py-1.5 rounded-lg transition-colors"
                title="Edit module"
              >
                <Edit3 size={13} />
                Edit
              </button>
              {onConfigureOverride && (
                <button
                  type="button"
                  onClick={() => onConfigureOverride(module)}
                  className="flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg border border-purple-200 transition-colors"
                  title="Tenant Overrides"
                >
                  <Sliders size={13} />
                  Overrides
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(module)}
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Move to trash"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

