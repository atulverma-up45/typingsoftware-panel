import React from 'react';
import { Layers, Laptop } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { PlanActionsDropdown } from './PlanActionsDropdown';
import type { Plan } from '../api/planApi';

interface PlanTableViewProps {
  plans: Plan[];
  isDeletedView: boolean;
  onEdit: (plan: Plan) => void;
  onToggleStatus: (plan: Plan) => void;
  onViewDetails: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onRestore?: (plan: Plan) => void;
}

export const PlanTableView: React.FC<PlanTableViewProps> = ({
  plans,
  isDeletedView,
  onEdit,
  onToggleStatus,
  onViewDetails,
  onDelete,
  onRestore,
}) => {
  return (
    <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th scope="col" className="py-3 px-4">Tier Identity</th>
              <th scope="col" className="py-3 px-4">Price / Term</th>
              <th scope="col" className="py-3 px-4">Station Quota</th>
              <th scope="col" className="py-3 px-4">Features</th>
              <th scope="col" className="py-3 px-4">Status</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {plans.map((plan) => {
              const priceFormatted = (plan.price / 100).toLocaleString('en-IN', {
                maximumFractionDigits: 2,
              });
              const f = plan.features || {};

              return (
                <tr key={plan.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary flex items-center justify-center shrink-0">
                        <Layers size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">{plan.name}</span>
                        <span className="text-[11px] text-gray-400 font-mono">{plan.id}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-gray-900">₹{priceFormatted}</span>
                    <span className="text-[11px] text-gray-500 block">
                      / {plan.durationDays} Days
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-orange-50 text-orange-800 px-2 py-0.5 rounded-md border border-orange-100">
                      <Laptop size={13} className="text-primary" />
                      {plan.maxActivations} PCs
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {f.englishTyping && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          English
                        </span>
                      )}
                      {f.hindiTyping && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          Hindi
                        </span>
                      )}
                      {f.governmentExams && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          Exams
                        </span>
                      )}
                      {f.customBranding && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                          Branding
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge
                      status={plan.deletedAt ? 'TRASH' : plan.status}
                      size="sm"
                    />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <PlanActionsDropdown
                      plan={plan}
                      onEdit={onEdit}
                      onToggleStatus={onToggleStatus}
                      onViewDetails={onViewDetails}
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
    </div>
  );
};

