import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Sparkles,
  Laptop,
  Calendar,
  Check,
  Shield,
  HelpCircle,
  Clock,
  IndianRupee,
} from 'lucide-react';
import { useCreatePlan } from '../api/planApi';
import type { CreatePlanInput } from '../api/planApi';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({ isOpen, onClose }) => {
  const createPlanMutation = useCreatePlan();

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceRupees, setPriceRupees] = useState<string>('9999');
  const [currency, setCurrency] = useState('INR');
  const [durationDays, setDurationDays] = useState<number>(365);
  const [maxActivations, setMaxActivations] = useState<number>(10);
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  // Features State
  const [englishTyping, setEnglishTyping] = useState(true);
  const [hindiTyping, setHindiTyping] = useState(true);
  const [governmentExams, setGovernmentExams] = useState(true);
  const [studentManagement, setStudentManagement] = useState(true);
  const [advancedReports, setAdvancedReports] = useState(false);
  const [customBranding, setCustomBranding] = useState(true);
  const [offlineGraceDays, setOfflineGraceDays] = useState<number>(14);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericPrice = Math.max(0, Math.round((parseFloat(priceRupees) || 0) * 100));

    const payload: CreatePlanInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: numericPrice,
      currency: currency.trim() || 'INR',
      durationDays: Number(durationDays) || 365,
      maxActivations: Number(maxActivations) || 5,
      status,
      features: {
        englishTyping,
        hindiTyping,
        governmentExams,
        studentManagement,
        advancedReports,
        customBranding,
        offlineGraceDays: Number(offlineGraceDays) || 14,
      },
    };

    try {
      await createPlanMutation.mutateAsync(payload);
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setPriceRupees('9999');
      setDurationDays(365);
      setMaxActivations(10);
    } catch {
      // Error handled by mutation hook toast
    }
  };

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
              <h2 className="text-base font-bold text-gray-900">Create Commercial Plan Tier</h2>
              <p className="text-xs text-gray-500">Configure tier limits, pricing, and entitled feature flags</p>
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Section 1: Basic Metadata */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              1. Tier Identity & Description
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Plan Tier Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Computer Lab, Enterprise Academy Tier"
                className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Marketing Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of target audience, ideal computer lab size, or bundle details..."
                className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
              />
            </div>
          </div>

          {/* Section 2: Pricing & Validity */}
          <div className="space-y-4 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              2. Commercial Pricing & Billing Term
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Plan Price (₹ Rupees) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <IndianRupee size={15} />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    placeholder="9999.00"
                    className="w-full pl-8 pr-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Currency Code
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
                >
                  <option value="INR">INR (Indian Rupee - ₹)</option>
                  <option value="USD">USD (US Dollar - $)</option>
                </select>
              </div>
            </div>

            {/* Validity Presets */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Billing Term Duration (Days)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { label: '30 Days (1 Month)', value: 30 },
                  { label: '90 Days (Quarterly)', value: 90 },
                  { label: '180 Days (Half-Year)', value: 180 },
                  { label: '365 Days (1 Year)', value: 365 },
                  { label: '730 Days (2 Years)', value: 730 },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDurationDays(preset.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      durationDays === preset.value
                        ? 'bg-[#fff0eb] text-[#ff8a5c] border-[#ff8a5c]'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                required
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
              />
            </div>
          </div>

          {/* Section 3: Quotas & Capacity */}
          <div className="space-y-4 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              3. Computer Lab Workstation Limits
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Max Active Workstations <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[1, 5, 10, 20, 30, 50, 100].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setMaxActivations(count)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                        maxActivations === count
                          ? 'bg-[#fff0eb] text-[#ff8a5c] border-[#ff8a5c]'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {count} PCs
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={maxActivations}
                  onChange={(e) => setMaxActivations(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Offline Grace Period (Days)
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  Allowed days without internet connection before license verification fails
                </p>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={offlineGraceDays}
                  onChange={(e) => setOfflineGraceDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Entitled Feature Matrix */}
          <div className="space-y-4 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              4. Entitled Software Feature Flags
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: 'English Typing Engine',
                  desc: 'Comprehensive English drills, tests, and exercises',
                  checked: englishTyping,
                  toggle: () => setEnglishTyping(!englishTyping),
                },
                {
                  label: 'Hindi Typing & Font Engines',
                  desc: 'Remington Gail, Inscript, Krutidev, and Mangal',
                  checked: hindiTyping,
                  toggle: () => setHindiTyping(!hindiTyping),
                },
                {
                  label: 'Govt Exam Simulator Sets',
                  desc: 'SSC, High Court, Railway, and State Exam formats',
                  checked: governmentExams,
                  toggle: () => setGovernmentExams(!governmentExams),
                },
                {
                  label: 'Student Management & Batches',
                  desc: 'Lab batch assignment, student logs, and scores',
                  checked: studentManagement,
                  toggle: () => setStudentManagement(!studentManagement),
                },
                {
                  label: 'White-Label Branding',
                  desc: 'Custom institute logo, title, and theme in app client',
                  checked: customBranding,
                  toggle: () => setCustomBranding(!customBranding),
                },
                {
                  label: 'Advanced Reports & Export',
                  desc: 'In-depth keystroke analytics and PDF export',
                  checked: advancedReports,
                  toggle: () => setAdvancedReports(!advancedReports),
                },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  onClick={feat.toggle}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    feat.checked
                      ? 'bg-[#fffaf8] border-[#ff8a5c]/40 shadow-2xs'
                      : 'bg-white border-gray-200 hover:bg-gray-50/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={feat.checked}
                    onChange={feat.toggle}
                    className="mt-0.5 h-4 w-4 rounded text-[#ff8a5c] focus:ring-[#ff8a5c]/30 accent-[#ff8a5c]"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-gray-800">{feat.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Initial Status */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-800">Initial Plan Status</p>
              <p className="text-[11px] text-gray-500">Active plans appear in billing selection catalogs</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatus('ARCHIVED')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  status === 'ARCHIVED'
                    ? 'bg-gray-100 text-gray-800 border-gray-300 font-semibold'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Archived
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPlanMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {createPlanMutation.isPending ? 'Creating Plan...' : 'Create Commercial Tier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

