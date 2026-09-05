import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Edit3,
  FileText,
  Clock,
  Check,
} from 'lucide-react';
import { useUpdateContent } from '../api/contentApi';
import type { ContentItem, UpdateContentInput, ContentDifficulty, ContentStatus } from '../api/contentApi';

interface EditContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ContentItem | null;
}

export const EditContentModal: React.FC<EditContentModalProps> = ({ isOpen, onClose, item }) => {
  const updateContentMutation = useUpdateContent();

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('en');
  const [difficulty, setDifficulty] = useState<ContentDifficulty>('MEDIUM');
  const [durationMinutes, setDurationMinutes] = useState<number>(10);
  const [passageText, setPassageText] = useState('');
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');

  const [allowBackspace, setAllowBackspace] = useState(true);
  const [highlightWord, setHighlightWord] = useState(true);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setLanguage(item.language || 'en');
      setDifficulty(item.difficulty);
      setDurationMinutes(item.durationMinutes);
      setPassageText(item.payload?.text || '');
      setStatus(item.status);

      const examConfig = item.payload?.examConfig || {};
      setAllowBackspace(examConfig.allowBackspace ?? true);
      setHighlightWord(examConfig.highlightWord ?? true);
    }
  }, [item]);

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

  // Real-time Text Metrics
  const metrics = useMemo(() => {
    const trimmed = passageText.trim();
    if (!trimmed) return { words: 0, characters: 0 };
    const words = trimmed.split(/\s+/).filter(Boolean);
    return {
      words: words.length,
      characters: passageText.length,
    };
  }, [passageText]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpdateContentInput = {
      title: title.trim(),
      language,
      difficulty,
      durationMinutes: Number(durationMinutes) || 10,
      payload: {
        ...(item.payload || {}),
        text: passageText,
        wordsCount: metrics.words,
        examConfig: {
          ...(item.payload?.examConfig || {}),
          allowBackspace,
          highlightWord,
        },
      },
      status,
    };

    try {
      await updateContentMutation.mutateAsync({ id: item.id, data: payload });
      onClose();
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fffaf8]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c]">
              <Edit3 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Edit Content Item</h2>
              <p className="text-xs text-gray-500 font-mono">ID: {item.id}</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Content Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c]"
              >
                <option value="en">English (en)</option>
                <option value="hi">Hindi - Krutidev (hi)</option>
                <option value="hi-mangal">Hindi - Mangal (hi-mangal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as ContentDifficulty)}
                className="w-full px-3 py-2 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c]"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
                <option value="EXAM">EXAM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Exercise Text Passage
              </label>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span>{metrics.words} Words</span>
                <span>•</span>
                <span>{metrics.characters} Characters</span>
              </div>
            </div>
            <textarea
              rows={8}
              required
              value={passageText}
              onChange={(e) => setPassageText(e.target.value)}
              className="w-full p-3.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 leading-relaxed font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-800">Status</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus('PUBLISHED')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  status === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setStatus('DRAFT')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  status === 'DRAFT'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 font-semibold'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Draft
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
              disabled={updateContentMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {updateContentMutation.isPending ? 'Saving...' : 'Save Content Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

