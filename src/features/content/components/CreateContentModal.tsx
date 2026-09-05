import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  Languages,
  Clock,
  Laptop,
  Check,
  Building2,
  Layers,
  Sparkles,
  Sliders,
  Type,
  CheckCircle2,
} from 'lucide-react';
import { useCreateContent } from '../api/contentApi';
import type { CreateContentInput, ContentType, ContentDifficulty, ContentStatus } from '../api/contentApi';
import { useModules } from '@/features/modules/api/moduleApi';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { useAuthStore } from '@/stores/auth.store';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateContentModal: React.FC<CreateContentModalProps> = ({ isOpen, onClose }) => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const createContentMutation = useCreateContent();

  const { data: modulesData } = useModules({ limit: 100, status: 'ACTIVE' });
  const { data: institutionsData } = useInstitutions({ limit: 100, status: 'ACTIVE' });

  const modules = modulesData?.data || [];
  const institutions = institutionsData?.data || [];

  // Form State
  const [scope, setScope] = useState<'GLOBAL' | 'INSTITUTION'>('GLOBAL');
  const [institutionId, setInstitutionId] = useState<string>('');
  const [moduleId, setModuleId] = useState<string>('');
  const [contentType, setContentType] = useState<ContentType>('PASSAGE');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('en');
  const [difficulty, setDifficulty] = useState<ContentDifficulty>('MEDIUM');
  const [durationMinutes, setDurationMinutes] = useState<number>(10);
  const [passageText, setPassageText] = useState('');
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');

  // Exam Rules State
  const [allowBackspace, setAllowBackspace] = useState(true);
  const [backspacePenalty, setBackspacePenalty] = useState(1);
  const [highlightWord, setHighlightWord] = useState(true);
  const [requirePunctuation, setRequirePunctuation] = useState(true);

  // Auto-select first module
  useEffect(() => {
    if (modules.length > 0 && !moduleId) {
      setModuleId(modules[0].id);
    }
  }, [modules, moduleId]);

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
    if (!trimmed) return { words: 0, characters: 0, estWpm35: 0, estWpm40: 0 };

    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordsCount = words.length;
    const characters = passageText.length;
    const estMinutesAt35 = Math.ceil(wordsCount / 35);
    const estMinutesAt40 = Math.ceil(wordsCount / 40);

    return {
      words: wordsCount,
      characters,
      estWpm35: estMinutesAt35,
      estWpm40: estMinutesAt40,
    };
  }, [passageText]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moduleId || !title.trim()) return;

    const targetInstitutionId =
      scope === 'INSTITUTION' && institutionId ? institutionId : undefined;

    const payload: CreateContentInput = {
      institutionId: targetInstitutionId,
      moduleId,
      contentType,
      title: title.trim(),
      language: language.trim() || 'en',
      difficulty,
      durationMinutes: Number(durationMinutes) || 10,
      payload: {
        text: passageText,
        wordsCount: metrics.words,
        rules: {
          highlightWord,
          requirePunctuation,
        },
        examConfig: {
          allowBackspace,
          backspacePenalty: Number(backspacePenalty) || 0,
          highlightWord,
          requirePunctuation,
        },
      },
      status,
    };

    try {
      await createContentMutation.mutateAsync(payload);
      onClose();
      // Reset form
      setTitle('');
      setPassageText('');
    } catch {
      // Error handled by mutation hook
    }
  };

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
              <h2 className="text-base font-bold text-gray-900">Create Educational Content Item</h2>
              <p className="text-xs text-gray-500">Draft typing passage, official exam test, or skill practice drill</p>
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
          {/* Section 1: Scope & Association */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              1. Content Scope & Module Association
            </h3>

            {/* Scope Selection */}
            {isSuperAdmin && (
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setScope('GLOBAL')}
                  className={`p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    scope === 'GLOBAL'
                      ? 'bg-[#fffaf8] border-[#ff8a5c] shadow-2xs'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-900">Global Platform Content</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                    Visible to all typing institutions and desktop client labs
                  </p>
                </div>

                <div
                  onClick={() => setScope('INSTITUTION')}
                  className={`p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    scope === 'INSTITUTION'
                      ? 'bg-[#fffaf8] border-[#ff8a5c] shadow-2xs'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-900">Institution-Specific Custom</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                    Exclusive to a specific computer lab or institute
                  </p>
                </div>
              </div>
            )}

            {scope === 'INSTITUTION' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Target Institution <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
                >
                  <option value="">-- Select Target Institution --</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Module Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Typing Module Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.key})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Content Specifications */}
          <div className="space-y-4 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              2. Passage Details & Language Settings
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Content Title / Lesson Header <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SSC CGL 2024 Tier-1 Shift-2 Test Paper, Daily Speed Drill #12"
                className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="w-full px-3 py-2 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c]"
                >
                  <option value="PASSAGE">Practice Passage</option>
                  <option value="EXAM_PAPER">Official Exam Paper</option>
                  <option value="LESSON">Keyboard Lesson</option>
                  <option value="PRACTICE_SET">Timed Practice Set</option>
                  <option value="VOCATIONAL_COURSE">Vocational Course</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Language & Font
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c]"
                >
                  <option value="en">English (en)</option>
                  <option value="hi">Hindi - Krutidev (hi)</option>
                  <option value="hi-mangal">Hindi - Mangal / Remington (hi-mangal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Difficulty Rating
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as ContentDifficulty)}
                  className="w-full px-3 py-2 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c]"
                >
                  <option value="EASY">EASY (Novice)</option>
                  <option value="MEDIUM">MEDIUM (Standard)</option>
                  <option value="HARD">HARD (Technical / Numbers)</option>
                  <option value="EXAM">EXAM (Strict Pattern)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Test Duration (Minutes)
              </label>
              <div className="flex items-center gap-2">
                {[5, 10, 15, 20].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                      durationMinutes === mins
                        ? 'bg-[#fff0eb] text-[#ff8a5c] border-[#ff8a5c]'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-24 px-3 py-1 text-xs bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#ff8a5c]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Passage Text & Live Telemetry */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                3. Typing Exercise Passage
              </h3>
              {/* Telemetry Counter Chips */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 font-bold">
                  {metrics.words} Words
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                  {metrics.characters} Chars
                </span>
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                  ~{metrics.estWpm35} min at 35 WPM
                </span>
              </div>
            </div>

            <textarea
              rows={6}
              required
              value={passageText}
              onChange={(e) => setPassageText(e.target.value)}
              placeholder="Paste or type the exercise paragraph here. Keystroke meters and word counts calculate automatically..."
              className="w-full p-3.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 leading-relaxed font-sans"
            />
          </div>

          {/* Section 4: Exam Simulator Rules */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              4. Exam Simulator Evaluation Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setAllowBackspace(!allowBackspace)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  allowBackspace
                    ? 'bg-[#fffaf8] border-[#ff8a5c]/40'
                    : 'bg-white border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={allowBackspace}
                  onChange={() => setAllowBackspace(!allowBackspace)}
                  className="mt-0.5 h-4 w-4 text-[#ff8a5c] accent-[#ff8a5c]"
                />
                <div className="text-xs">
                  <p className="font-semibold text-gray-800">Allow Backspace Key</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Permit student to correct mistakes during test
                  </p>
                </div>
              </div>

              <div
                onClick={() => setHighlightWord(!highlightWord)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  highlightWord
                    ? 'bg-[#fffaf8] border-[#ff8a5c]/40'
                    : 'bg-white border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={highlightWord}
                  onChange={() => setHighlightWord(!highlightWord)}
                  className="mt-0.5 h-4 w-4 text-[#ff8a5c] accent-[#ff8a5c]"
                />
                <div className="text-xs">
                  <p className="font-semibold text-gray-800">Highlight Active Word</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Visual colored cursor on current target word
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Publication Status */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-800">Publish State</p>
              <p className="text-[11px] text-gray-500">Published items sync immediately to workstation clients</p>
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
              disabled={createContentMutation.isPending || !title.trim() || !passageText.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {createContentMutation.isPending ? 'Publishing...' : 'Publish Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

