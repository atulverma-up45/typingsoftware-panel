import React from 'react';
import { FileText, Building2, Sparkles, Clock } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { ContentActionsDropdown } from './ContentActionsDropdown';
import type { ContentItem } from '../api/contentApi';

interface ContentTableViewProps {
  contentItems: ContentItem[];
  isDeletedView: boolean;
  onViewDetails: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onChangeStatus: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onRestore?: (item: ContentItem) => void;
}

export const ContentTableView: React.FC<ContentTableViewProps> = ({
  contentItems,
  isDeletedView,
  onViewDetails,
  onEdit,
  onChangeStatus,
  onDelete,
  onRestore,
}) => {
  return (
    <div className="hidden md:block overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <th scope="col" className="py-3 px-4">Title & Format</th>
            <th scope="col" className="py-3 px-4">Module Category</th>
            <th scope="col" className="py-3 px-4">Scope</th>
            <th scope="col" className="py-3 px-4">Difficulty / Duration</th>
            <th scope="col" className="py-3 px-4">Words Count</th>
            <th scope="col" className="py-3 px-4">Status</th>
            <th scope="col" className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-xs">
          {contentItems.map((item) => {
            const payload = (item.payload as Record<string, unknown>) || {};
            const words =
              Number(payload.wordsCount) ||
              (typeof payload.text === 'string'
                ? payload.text.trim().split(/\s+/).filter(Boolean).length
                : 0);

            const isHindi = item.language?.startsWith('hi');

            return (
              <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                {/* Title & Format */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900">{item.title}</span>
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
                        {item.contentType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Module Category */}
                <td className="py-3.5 px-4">
                  <span className="font-medium text-gray-800 block">
                    {item.module?.name || item.moduleId}
                  </span>
                  <span className="font-mono text-[11px] text-gray-400">
                    {item.module?.key || 'module'}
                  </span>
                </td>

                {/* Scope */}
                <td className="py-3.5 px-4">
                  {item.institutionId ? (
                    <span className="inline-flex items-center gap-1 font-medium text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[11px]">
                      <Building2 size={12} />
                      {item.institution?.name || 'Custom Tenant'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                      <Sparkles size={12} />
                      Global Platform
                    </span>
                  )}
                </td>

                {/* Difficulty / Duration */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
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
                    <span className="text-gray-500 font-medium flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      {item.durationMinutes} min
                    </span>
                  </div>
                </td>

                {/* Words Count */}
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-gray-800">
                    {words} Words
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <StatusBadge
                    status={item.deletedAt ? 'TRASH' : item.status}
                    size="sm"
                  />
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <ContentActionsDropdown
                    item={item}
                    onViewDetails={onViewDetails}
                    onEdit={onEdit}
                    onChangeStatus={onChangeStatus}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    isDeletedView={isDeletedView}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

