import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Layers,
  Sliders,
  Code2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useSetInstitutionModule } from '../api/moduleApi';
import type { TypingModule } from '../api/moduleApi';
import { useInstitutions } from '@/features/institutions/api/institutionApi';

interface ConfigureTenantModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: TypingModule[];
  preselectedModule?: TypingModule | null;
}

export const ConfigureTenantModuleModal: React.FC<ConfigureTenantModuleModalProps> = ({
  isOpen,
  onClose,
  modules,
  preselectedModule,
}) => {
  const setInstitutionModuleMutation = useSetInstitutionModule();
  const { data: institutionsData } = useInstitutions({ limit: 100, status: 'ACTIVE' });
  const institutions = institutionsData?.data || [];

  const [institutionId, setInstitutionId] = useState('');
  const [moduleId, setModuleId] = useState(preselectedModule?.id || '');
  const [enabled, setEnabled] = useState(true);
  const [customConfigJson, setCustomConfigJson] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedModule) {
      setModuleId(preselectedModule.id);
    }
  }, [preselectedModule]);

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

    if (!institutionId || !moduleId) return;

    let parsedConfig: Record<string, unknown> = {};
    if (customConfigJson.trim()) {
      try {
        parsedConfig = JSON.parse(customConfigJson);
        setJsonError(null);
      } catch (err: any) {
        setJsonError(err.message || 'Invalid JSON syntax');
        return;
      }
    }

    try {
      await setInstitutionModuleMutation.mutateAsync({
        institutionId,
        data: {
          moduleId,
          enabled,
          customConfig: parsedConfig,
        },
      });
      onClose();
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fffaf8]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c]">
              <Sliders size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Configure Institution Override</h2>
              <p className="text-xs text-gray-500">Enable or override module behavior for a specific customer lab</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Customer Institution <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
            >
              <option value="">-- Select Institution --</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Typing Module <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
            >
              <option value="">-- Select Module --</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.key})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-semibold text-gray-800">Module Status for this Tenant</p>
              <p className="text-[11px] text-gray-500">Enable or explicitly disable for this institution</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEnabled(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Enabled
              </button>
              <button
                type="button"
                onClick={() => setEnabled(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  !enabled
                    ? 'bg-rose-50 text-rose-700 border-rose-300 font-semibold'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Disabled
              </button>
            </div>
          </div>

          <div className="pt-2">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
              <Code2 size={14} className="text-gray-400" />
              Custom JSON Override Config
            </label>
            <textarea
              rows={4}
              value={customConfigJson}
              onChange={(e) => {
                setCustomConfigJson(e.target.value);
                setJsonError(null);
              }}
              className={`w-full p-3 text-xs font-mono bg-gray-900 text-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 ${
                jsonError ? 'border-rose-500' : 'border-gray-700'
              }`}
            />
            {jsonError && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {jsonError}
              </p>
            )}
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
              disabled={setInstitutionModuleMutation.isPending || !institutionId || !moduleId}
              className="px-5 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {setInstitutionModuleMutation.isPending ? 'Saving...' : 'Save Tenant Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

