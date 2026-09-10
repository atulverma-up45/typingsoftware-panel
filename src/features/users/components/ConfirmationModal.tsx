import React, { useState } from 'react';
import { AlertTriangle, Trash2, RotateCcw, AlertOctagon, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

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

/** Per-variant accent chip, icon, and button styles (shared design-system tones). */
const CONFIRMATION_VARIANTS: Record<
  ConfirmationVariant,
  { icon: React.ReactNode; accent: string; button: string }
> = {
  critical: {
    icon: <AlertOctagon size={20} />,
    accent: 'bg-red-50 text-red-600 border-red-100',
    button: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500',
  },
  danger: {
    icon: <Trash2 size={20} />,
    accent: 'bg-rose-50 text-rose-600 border-rose-100',
    button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    accent: 'bg-amber-50 text-amber-600 border-amber-100',
    button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm focus:ring-amber-500',
  },
  info: {
    icon: <RotateCcw size={20} />,
    accent: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    button: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm focus:ring-indigo-500',
  },
};

/**
 * Standardized confirmation dialog (built on the shared <Modal> shell).
 * The parent unmounts this component whenever `isOpen` is false, so the
 * typed-confirmation state resets naturally on every open — no reset effect.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
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

  if (!isOpen) return null;

  const styles = CONFIRMATION_VARIANTS[variant];
  const isConfirmationMatched = requireConfirmationText
    ? typedValue.trim().toLowerCase() === requireConfirmationText.trim().toLowerCase()
    : true;

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title={title}
      description={description}
      icon={styles.icon}
      accentClassName={styles.accent}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={!isLoading}
      footer={
        <>
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
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </>
      }
    >
      {requireConfirmationText && (
        <div className="px-6 pt-1 pb-2">
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              To confirm, please type{' '}
              <span className="font-mono text-red-600 font-bold select-all">
                "{requireConfirmationText}"
              </span>{' '}
              below:
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
        </div>
      )}
    </Modal>
  );
};

