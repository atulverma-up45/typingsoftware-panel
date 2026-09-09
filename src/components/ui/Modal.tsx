import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

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
  description?: string;
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

export type ConfirmVariant = 'danger' | 'primary';

const CONFIRM_ACCENT_CLASSES: Record<ConfirmVariant, string> = {
  danger: 'bg-rose-50 text-rose-600 border-rose-100',
  primary: 'bg-primary-100 text-primary border-primary-200',
};

const CONFIRM_BUTTON_CLASSES: Record<ConfirmVariant, string> = {
  danger: 'bg-rose-600 hover:bg-rose-700',
  primary: 'bg-primary hover:bg-primary-600',
};

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: React.ReactNode;
  isPending?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon,
  isPending = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
      icon={icon}
      accentClassName={CONFIRM_ACCENT_CLASSES[variant]}
      closeOnBackdrop={!isPending}
      closeOnEscape={!isPending}
      showCloseButton={false}
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
            disabled={isPending}
            className={`px-5 py-2 text-sm font-medium text-white rounded-xl shadow-sm transition-all disabled:opacity-50 ${CONFIRM_BUTTON_CLASSES[variant]}`}
          >
            {isPending ? 'Working...' : confirmLabel}
          </button>
        </>
      }
    >
      {message && <div className="p-6 text-sm text-gray-600 leading-relaxed">{message}</div>}
    </Modal>
  );
};

export default Modal;