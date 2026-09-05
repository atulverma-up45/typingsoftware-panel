import React from 'react';
import {
  Check,
  X,
  Laptop,
  Calendar,
  Clock,
  Edit3,
  Archive,
  RotateCcw,
  Trash2,
  Sparkles,
  Shield,
  Layers,
  FileText,
  Building2,
} from 'lucide-react';
import type { Plan } from '../api/planApi';

interface PlanCardProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onToggleStatus: (plan: Plan) => void;
  onViewDetails: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onRestore?: (plan: Plan) => void;
  isDeletedView?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onEdit,
  onToggleStatus,
  onViewDetails,
  onDelete,
  onRestore,
  isDeletedView = false,
}) => {
  const isArchived = plan.status === 'ARCHIVED';
  const priceFormatted = (plan.price / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });

  const features = plan.features || {};

  const featureItems = [
    { key: 'englishTyping', label: 'English Typing Engine', enabled: !!features.englishTyping },
    { key: 'hindiTyping', label: 'Hindi Typing & Fonts', enabled: !!features.hindiTyping },
    { key: 'governmentExams', label: 'Govt Exam Simulator Sets', enabled: !!features.governmentExams },
    { key: 'studentManagement', label: 'Student Management & Batches', enabled: !!features.studentManagement },
    { key: 'customBranding', label: 'White-Label Custom Branding', enabled: !!features.customBranding },
    { key: 'advancedReports', label: 'Advanced Speed & Error Reports', enabled: !!features.advancedReports },
  ];

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-white p-6 shadow-sm hover:shadow-md ${
        isArchived || isDeletedView
          ? 'border-gray-200 opacity-80 bg-gray-50/50'
          : 'border-gray-200 hover:border-[#ff8a5c]/50'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">{plan.name}</h3>
              {isDeletedView ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  In Trash
                </span>
              ) : isArchived ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  Archived
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Tier
                </span>
              )}
            </div>
            {plan.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                {plan.description}
              </p>
            )}
          </div>
          <div className="h-9 w-9 rounded-xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center shrink-0">
            <Layers size={18} strokeWidth={2.2} />
          </div>
        </div>

        {/* Pricing Block */}
        <div className="my-4 py-3 px-4 bg-gray-50/80 rounded-xl border border-gray-100 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-extrabold text-gray-900">
              ₹{priceFormatted}
            </span>
            <span className="text-xs text-gray-500 ml-1">
              / {plan.durationDays} days
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-white rounded-lg border border-gray-200 text-gray-600 shadow-2xs">
            {plan.currency}
          </span>
        </div>

        {/* Capacity & Validity Chips */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-orange-50/50 border border-orange-100 text-orange-800">
            <Laptop size={15} className="text-[#ff8a5c] shrink-0" />
            <span className="font-semibold">
              {plan.maxActivations} {plan.maxActivations === 1 ? 'Station' : 'Stations'}
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-800">
            <Clock size={15} className="text-blue-500 shrink-0" />
            <span>
              {features.offlineGraceDays || 14}d Offline Grace
            </span>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Included Capabilities
          </p>
          <ul className="space-y-1.5 text-xs">
            {featureItems.map((item) => (
              <li
                key={item.key}
                className={`flex items-center gap-2 ${
                  item.enabled ? 'text-gray-700' : 'text-gray-400 line-through'
                }`}
              >
                {item.enabled ? (
                  <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                    <X size={10} strokeWidth={2.5} />
                  </div>
                )}
                <span className="truncate">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(plan)}
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
                  onClick={() => onRestore(plan)}
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                  title="Restore plan"
                >
                  <RotateCcw size={13} />
                  Restore
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(plan)}
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
                onClick={() => onToggleStatus(plan)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                  isArchived
                    ? 'text-emerald-700 bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                    : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                title={isArchived ? 'Activate plan' : 'Archive plan'}
              >
                {isArchived ? 'Activate' : 'Archive'}
              </button>
              <button
                type="button"
                onClick={() => onEdit(plan)}
                className="flex items-center gap-1 text-xs font-medium text-[#ff8a5c] bg-[#fff0eb] hover:bg-[#ffe2d6] px-2.5 py-1.5 rounded-lg transition-colors"
                title="Edit plan"
              >
                <Edit3 size={13} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(plan)}
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

