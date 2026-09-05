import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Layers,
  Code2,
  AlertCircle,
} from 'lucide-react';
import { useUpdateModule } from '../api/moduleApi';
import type { TypingModule, UpdateModuleInput } from '../api/moduleApi';

interface EditModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: TypingModule | null;
}

export const EditModuleModal: React.FC<EditModuleModalProps> = ({ isOpen, onClose, module }) => {
  const updateModuleMutation = useUpdateModule();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [configJson, setConfigJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (module) {
      setName(module.name);
      setDescription(module.description || '');
      setStatus(module.status);
      setConfigJson(JSON.stringify(module.configuration || {}, null, 2));
      setJsonError(null);
    }
  }, [module]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let parsedConfig: Record<string, unknown> = {};
    if (configJson.trim()) {
      try {
        parsedConfig = JSON.parse(configJson);
        setJsonError(null);
      } catch (err: any) {
        setJsonError(err.message || 'Invalid JSON syntax');
        return;
      }
    }

    const payload: UpdateModuleInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      configuration: parsedConfig,
    };

    try {
      await updateModuleMutation.mutateAsync({ id: module.id, data: payload });
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
              <Edit3 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Edit Typing Module</h2>
              <p className="text-xs text-gray-500 font-mono">Key: {module.key}</p>
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
              Module Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-semibold text-gray-800">Operational Status</p>
              <p className="text-[11px] text-gray-500">Toggle whether this module is globally available</p>
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
                onClick={() => setStatus('INACTIVE')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  status === 'INACTIVE'
                    ? 'bg-gray-100 text-gray-800 border-gray-300 font-semibold'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Code2 size={14} className="text-gray-400" />
                Default JSON Configuration
              </label>
            </div>
            <textarea
              rows={5}
              value={configJson}
              onChange={(e) => {
                setConfigJson(e.target.value);
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
              disabled={updateModuleMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {updateModuleMutation.isPending ? 'Saving...' : 'Save Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

