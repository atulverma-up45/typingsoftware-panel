import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Clock,
  Check,
  Copy,
  Building2,
  Layers,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ContentItem } from '../api/contentApi';

interface ContentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ContentItem | null;
}

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({ isOpen, onClose, item }) => {
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'RULES' | 'TECHNICAL'>('PREVIEW');

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

  if (!isOpen || !item) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const payload = item.payload || {};
  const examConfig = payload.examConfig || {};
  const text = payload.text || '';
  const wordsCount = payload.wordsCount || text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fffaf8]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c]">
              <FileText size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">{item.title}</h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    item.status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : item.status === 'DRAFT'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="font-mono text-xs text-gray-400 mt-0.5">ID: {item.id}</p>
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
            { id: 'PREVIEW', label: 'Passage Text & Reading' },
            { id: 'RULES', label: 'Exam Evaluation Rules' },
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
          {/* TAB 1: PREVIEW */}
          {activeTab === 'PREVIEW' && (
            <div className="space-y-4">
              {/* Telemetry Highlight Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Word Count
                  </span>
                  <span className="text-base font-bold text-gray-900 mt-1 block">
                    {wordsCount} Words
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Characters
                  </span>
                  <span className="text-base font-bold text-gray-900 mt-1 block">
                    {text.length} Chars
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Time Limit
                  </span>
                  <span className="text-base font-bold text-blue-600 mt-1 block">
                    {item.durationMinutes} Minutes
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Difficulty
                  </span>
                  <span className="text-base font-bold text-purple-600 mt-1 block">
                    {item.difficulty}
                  </span>
                </div>
              </div>

              {/* Formatted Passage Reading Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Exercise Paragraph Text</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(text, 'Passage text')}
                    className="flex items-center gap-1 text-xs text-[#ff8a5c] font-medium hover:underline"
                  >
                    <Copy size={13} />
                    Copy Text
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200 text-xs text-gray-800 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar font-sans whitespace-pre-wrap">
                  {text || 'No text passage stored in payload.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RULES */}
          {activeTab === 'RULES' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-2">
                Desktop software applies these rules when conducting tests based on this exercise:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                  <span className="text-xs font-bold text-gray-900 block">Backspace Allowed</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {examConfig.allowBackspace !== false ? 'Yes (Can fix typos)' : 'No (Strict Exam Mode)'}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                  <span className="text-xs font-bold text-gray-900 block">Target Word Highlighting</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {examConfig.highlightWord !== false ? 'Enabled (Visual indicator)' : 'Disabled (Blind typing)'}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                  <span className="text-xs font-bold text-gray-900 block">Backspace Error Penalty</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {examConfig.backspacePenalty ? `${examConfig.backspacePenalty} keystroke penalty` : 'None'}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                  <span className="text-xs font-bold text-gray-900 block">Language & Script</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {item.language === 'hi' ? 'Hindi (Krutidev / Remington)' : 'English Standard'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TECHNICAL */}
          {activeTab === 'TECHNICAL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Raw Content JSON Object</span>
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(item, null, 2), 'JSON Data')}
                  className="flex items-center gap-1 text-xs text-[#ff8a5c] font-medium hover:underline"
                >
                  <Copy size={13} />
                  Copy JSON
                </button>
              </div>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-xs font-mono overflow-x-auto max-h-72 custom-scrollbar leading-relaxed">
                {JSON.stringify(item, null, 2)}
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

