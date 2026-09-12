import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  AlertOctagon,
  Trash2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------------------- */
/* Modal — the single modal shell for the entire admin panel.                  */
/* Owns: portal mounting, backdrop, Escape handling, body scroll lock,         */
/* a11y (role=dialog, aria-modal, focus on open).                              */
/* Feature code should NEVER hand-roll `fixed inset-0 z-50 ...` again.         */
/* ------------------------------------------------------------------------- */

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const MODAL_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional header block; renders icon chip + title + description. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Optional leading icon rendered inside a rounded accent chip. */
  icon?: React.ReactNode;
  /** Tailwind classes for the icon chip accent (e.g. 'bg-blue-50 text-blue-600 border-blue-100'). */
  accentClassName?: string;
  size?: ModalSize;
  children: React.ReactNode;
  /** Sticky footer row (actions). Rendered inside the panel below the body. */
  footer?: React.ReactNode;
  /** Hide the header entirely (full-custom body). */
  hideHeader?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  bodyClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  accentClassName = 'bg-primary-100 text-primary border-primary-200',
  size = 'lg',
  children,
  footer,
  hideHeader = false,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  bodyClassName = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape-to-close + body scroll lock while open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Move focus into the dialog for keyboard/screen-reader users
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`relative w-full ${MODAL_SIZE_CLASSES[size]} bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden outline-none animate-in zoom-in-95 duration-200 ${className}`}
      >
        {!hideHeader && (title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              {icon && (
                <div className={`p-2.5 rounded-xl border ${accentClassName}`}>{icon}</div>
              )}
              <div>
                {title && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
                {description && (
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div className={bodyClassName}>{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

/* ------------------------------------------------------------------------- */
/* ConfirmDialog — standardized destructive/action confirmation.               */
/* ------------------------------------------------------------------------- */

export type ConfirmVariant =
  | 'danger'
  | 'critical'
  | 'warning'
  | 'info'
  | 'primary';

/** Per-variant icon chip, accent and button tone. */
const CONFIRM_VARIANT_STYLES: Record<
  ConfirmVariant,
  { icon: React.ReactNode; accent: string; button: string }
> = {
  critical: {
    icon: <AlertOctagon size={20} />,
    accent: 'bg-red-50 text-red-600 border-red-100',
    button:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500',
  },
  danger: {
    icon: <Trash2 size={20} />,
    accent: 'bg-rose-50 text-rose-600 border-rose-100',
    button:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    accent: 'bg-amber-50 text-amber-600 border-amber-100',
    button:
      'bg-amber-600 hover:bg-amber-700 text-white shadow-sm focus:ring-amber-500',
  },
  info: {
    icon: <RotateCcw size={20} />,
    accent: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    button:
      'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm focus:ring-indigo-500',
  },
  primary: {
    icon: <ShieldCheck size={20} />,
    accent: 'bg-primary-100 text-primary border-primary-200',
    button:
      'bg-primary hover:bg-primary-600 text-white shadow-sm focus:ring-primary-500',
  },
};

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** Explanatory copy rendered under the title in the header. */
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  /** Overrides the per-variant default icon. */
  icon?: React.ReactNode;
  isPending?: boolean;
  /**
   * When set, the user must type this exact text (case-insensitive) before the
   * confirm button enables. Required for irreversible actions.
   */
  confirmPhrase?: string;
}

/**
 * The single confirmation dialog for the admin panel.
 *
 * Feature code must not hand-roll confirmations or re-declare variant maps.
 * The typed `confirmPhrase` guard resets on every open, so a phrase typed for
 * one target can never carry over to the next.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon,
  isPending = false,
  confirmPhrase,
}) => {
  const [typedValue, setTypedValue] = useState('');

  // Reset the typed guard whenever the dialog opens, so a phrase typed for one
  // target can never carry over to the next. This is React's documented
  // "adjust state during render" pattern — doing it in an effect would cost a
  // second commit and can briefly paint the previous target's typed phrase.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setTypedValue('');
  }

  const styles = CONFIRM_VARIANT_STYLES[variant];
  const isPhraseMatched =
    !confirmPhrase ||
    typedValue.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={title}
      description={description}
      icon={icon ?? styles.icon}
      accentClassName={styles.accent}
      closeOnBackdrop={!isPending}
      closeOnEscape={!isPending}
      showCloseButton={!isPending}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending || !isPhraseMatched}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      {confirmPhrase && (
        <div className="px-6 pt-1 pb-2">
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              To confirm, please type{' '}
              <span className="font-mono text-red-600 font-bold select-all">
                "{confirmPhrase}"
              </span>{' '}
              below:
            </label>
            <input
              type="text"
              autoFocus
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              placeholder={`Type "${confirmPhrase}" to verify`}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 font-mono"
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default Modal;