import React from 'react';
import { FileText, Clock } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { ContentActionsDropdown } from './ContentActionsDropdown';
import type { ContentItem } from '../api/contentApi';
import type { TypingModule } from '@/features/modules/api/moduleApi';

interface ContentCardProps {
  item: ContentItem;
  modules: TypingModule[];
  isDeletedView: boolean;
  onViewDetails: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onChangeStatus: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onRestore?: (item: ContentItem) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  item,
  modules,
  isDeletedView,
  onViewDetails,
  onEdit,
  onChangeStatus,
  onDelete,
  onRestore,
}) => {
  const payload = (item.payload as Record<string, unknown>) || {};
  const words =
    Number(payload.wordsCount) ||
    (typeof payload.text === 'string'
      ? payload.text.trim().split(/\s+/).filter(Boolean).length
      : 0);
  const isHindi = item.language?.startsWith('hi');

  return (
    <div
      onClick={() => onViewDetails(item)}
      className="p-4 space-y-3 hover:bg-gray-50/70 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">{item.title}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isHindi
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {item.language.toUpperCase()}
              </span>
            </div>
            <span className="text-[11px] text-gray-400">
              {item.module?.name ||
                modules.find((m) => m.id === item.moduleId)?.name ||
                'Module'}{' '}
              • v{item.version}.0
            </span>
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <ContentActionsDropdown
            item={item}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onChangeStatus={onChangeStatus}
            onDelete={onDelete}
            onRestore={onRestore}
            isDeletedView={isDeletedView}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            item.difficulty === 'EASY'
              ? 'bg-emerald-100 text-emerald-800'
              : item.difficulty === 'MEDIUM'
              ? 'bg-blue-100 text-blue-800'
              : item.difficulty === 'HARD'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-purple-100 text-purple-800'
          }`}
        >
          {item.difficulty}
        </span>

        <span className="text-gray-500 font-medium flex items-center gap-1 text-[11px]">
          <Clock size={12} className="text-gray-400" />
          {item.durationMinutes} min
        </span>

        <span className="text-gray-600 font-medium text-[11px] bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
          {words} words
        </span>

        <div className="ml-auto">
          <StatusBadge
            status={item.deletedAt ? 'TRASH' : item.status}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};

