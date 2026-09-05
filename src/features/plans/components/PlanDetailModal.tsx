import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Check,
  Laptop,
  Clock,
  Calendar,
  IndianRupee,
  Copy,
  Info,
  Shield,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Plan } from '../api/planApi';

interface PlanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
}

export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({ isOpen, onClose, plan }) => {
  const [activeTab, setActiveTab] = useState<'SPECS' | 'FEATURES' | 'TECHNICAL'>('SPECS');

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !plan) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const priceFormatted = (plan.price / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });

  const features = plan.features || {};

  const featureItems = [
    {
      key: 'englishTyping',
      label: 'English Typing Engine',
      desc: 'Speed drills, paragraph tests, custom lessons, accuracy meters',
      enabled: !!features.englishTyping,
    },
    {
      key: 'hindiTyping',
      label: 'Hindi Typing & Fonts',
      desc: 'Remington Gail, Inscript, Krutidev 010, and Mangal Unicode font sets',
      enabled: !!features.hindiTyping,
    },
    {
      key: 'governmentExams',
      label: 'Govt Exam Simulator Sets',
      desc: 'SSC CGL/CHSL, High Court Steno, Railway NTPC, and state clerk exam patterns',
      enabled: !!features.governmentExams,
    },
    {
      key: 'studentManagement',
      label: 'Student Management & Batches',
      desc: 'Batch scheduling, student profiles, performance records, and exportable marksheets',
      enabled: !!features.studentManagement,
    },
    {
      key: 'customBranding',
      label: 'White-Label Branding',
      desc: 'Custom institute logo, desktop app window title, splash screen, and custom installer build',
      enabled: !!features.customBranding,
    },
    {
      key: 'advancedReports',
      label: 'Advanced Speed & Error Reports',
      desc: 'Keystroke latency breakdown, backspace penalty analytics, and historical progress charts',
      enabled: !!features.advancedReports,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fffaf8]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c]">
              <Layers size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">{plan.name}</h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    plan.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {plan.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {plan.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-white gap-2">
          {[
            { id: 'SPECS', label: 'Commercial Specs' },
            { id: 'FEATURES', label: 'Entitled Features' },
            { id: 'TECHNICAL', label: 'Raw Metadata' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#ff8a5c] text-[#ff8a5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* TAB 1: SPECS */}
          {activeTab === 'SPECS' && (
            <div className="space-y-4">
              {/* Highlight Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Plan Price
                  </span>
                  <span className="text-lg font-bold text-gray-900 mt-1 block">
                    ₹{priceFormatted}
                  </span>
                  <span className="text-[11px] text-gray-500">Stored: {plan.price} paise</span>
                </div>

                <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Lab Workstations
                  </span>
                  <span className="text-lg font-bold text-gray-900 mt-1 block flex items-center gap-1.5">
                    <Laptop size={17} className="text-[#ff8a5c]" />
                    {plan.maxActivations} Seats
                  </span>
                  <span className="text-[11px] text-gray-500">Per subscribed institute</span>
                </div>

                <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Contract Term
                  </span>
                  <span className="text-lg font-bold text-gray-900 mt-1 block flex items-center gap-1.5">
                    <Clock size={17} className="text-blue-500" />
                    {plan.durationDays} Days
                  </span>
                  <span className="text-[11px] text-gray-500">~{Math.round(plan.durationDays / 30)} months</span>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Plan Description
                </span>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {plan.description || 'No marketing description provided for this tier.'}
                </p>
              </div>

              {/* Metadata List */}
              <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Plan Identifier</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-gray-800">{plan.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(plan.id, 'Plan ID')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Currency</span>
                  <span className="font-semibold text-gray-800">{plan.currency}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Offline Grace Limit</span>
                  <span className="font-semibold text-gray-800">
                    {features.offlineGraceDays || 14} Days
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Created On</span>
                  <span className="text-gray-800">
                    {new Date(plan.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-800">
                    {new Date(plan.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FEATURES */}
          {activeTab === 'FEATURES' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-2">
                All client workstations activated with licenses under this plan automatically inherit these permissions:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {featureItems.map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                      item.enabled
                        ? 'bg-emerald-50/30 border-emerald-200/60'
                        : 'bg-gray-50/50 border-gray-200/60 opacity-60'
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        item.enabled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {item.enabled ? <Check size={14} strokeWidth={2.5} /> : <X size={14} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{item.label}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.enabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {item.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TECHNICAL */}
          {activeTab === 'TECHNICAL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Raw Plan JSON Object</span>
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(plan, null, 2), 'JSON Data')}
                  className="flex items-center gap-1 text-xs text-[#ff8a5c] font-medium hover:underline"
                >
                  <Copy size={13} />
                  Copy JSON
                </button>
              </div>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-xs font-mono overflow-x-auto max-h-80 custom-scrollbar leading-relaxed">
                {JSON.stringify(plan, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

