import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, RotateCcw, AlertOctagon, X, Loader2 } from 'lucide-react';

export type ConfirmationVariant = 'danger' | 'critical' | 'warning' | 'info';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
  /**
   * If provided, requires the user to type this exact text before confirming
   * (Standard 20+ yr UX safety pattern for irreversible actions)
   */
  requireConfirmationText?: string;
}

const ConfirmationModalContent: React.FC<Omit<ConfirmationModalProps, 'isOpen'>> = ({
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  requireConfirmationText,
}) => {
  const [typedValue, setTypedValue] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, onClose]);

  const isConfirmationMatched = requireConfirmationText
    ? typedValue.trim().toLowerCase() === requireConfirmationText.trim().toLowerCase()
    : true;

  const getVariantStyles = () => {
    switch (variant) {
      case 'critical':
        return {
          icon: <AlertOctagon size={24} className="text-red-600" />,
          iconBg: 'bg-red-50 border-red-100',
          btnBg: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500',
        };
      case 'danger':
        return {
          icon: <Trash2 size={24} className="text-rose-600" />,
          iconBg: 'bg-rose-50 border-rose-100',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} className="text-amber-600" />,
          iconBg: 'bg-amber-50 border-amber-100',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm focus:ring-amber-500',
        };
      case 'info':
        return {
          icon: <RotateCcw size={24} className="text-indigo-600" />,
          iconBg: 'bg-indigo-50 border-indigo-100',
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm focus:ring-indigo-500',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl border ${vStyles.iconBg} shrink-0`}>
              {vStyles.icon}
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</p>
          </div>

          {requireConfirmationText && (
            <div className="mt-4 p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-gray-700">
                To confirm, please type <span className="font-mono text-red-600 font-bold select-all">"{requireConfirmationText}"</span> below:
              </label>
              <input
                type="text"
                autoFocus
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                placeholder={`Type "${requireConfirmationText}" to verify`}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 font-mono"
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading || !isConfirmationMatched}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${vStyles.btnBg}`}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <ConfirmationModalContent {...props} />;
};

