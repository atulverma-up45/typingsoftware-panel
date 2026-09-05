import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Code2,
  Copy,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TypingModule } from '../api/moduleApi';

interface ModuleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: TypingModule | null;
}

export const ModuleDetailModal: React.FC<ModuleDetailModalProps> = ({ isOpen, onClose, module }) => {
  const [activeTab, setActiveTab] = useState<'SPECS' | 'CONFIG' | 'GUIDE'>('SPECS');

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

  if (!isOpen || !module) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fffaf8]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c]">
              <Layers size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">{module.name}</h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    module.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {module.status}
                </span>
              </div>
              <p className="font-mono text-xs text-gray-400 mt-0.5">Key: {module.key}</p>
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
            { id: 'SPECS', label: 'Specifications' },
            { id: 'CONFIG', label: 'JSON Configuration' },
            { id: 'GUIDE', label: 'Integration' },
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
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {module.description || 'No marketing or architectural description provided.'}
                </p>
              </div>

              <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Module ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-gray-800">{module.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(module.id, 'Module ID')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">API Key Slug</span>
                  <span className="font-mono font-bold text-gray-800">{module.key}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Module Version</span>
                  <span className="font-semibold text-gray-800">Release v{module.version}.0</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Created On</span>
                  <span className="text-gray-800">
                    {new Date(module.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-800">
                    {new Date(module.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIG */}
          {activeTab === 'CONFIG' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Raw Configuration Object</span>
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(module.configuration, null, 2), 'JSON Configuration')}
                  className="flex items-center gap-1 text-xs text-[#ff8a5c] font-medium hover:underline"
                >
                  <Copy size={13} />
                  Copy JSON
                </button>
              </div>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-xs font-mono overflow-x-auto max-h-72 custom-scrollbar leading-relaxed">
                {JSON.stringify(module.configuration || {}, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 3: GUIDE */}
          {activeTab === 'GUIDE' && (
            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-blue-900">
                <h4 className="font-bold mb-1">Commercial Plan Entitlement</h4>
                <p>
                  Educational institutions inherit this module when their commercial subscription plan includes the corresponding capability flag or when overridden specifically for their tenant.
                </p>
              </div>
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-1">Desktop Client Execution</h4>
                <p>
                  Workstation desktop software activates this engine automatically upon verifying license tokens containing the <code className="font-mono text-gray-800 bg-white px-1 py-0.5 rounded border border-gray-200">{module.key}</code> identifier.
                </p>
              </div>
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

