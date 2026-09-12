import React, { useEffect, useId, useRef, useState } from 'react';
import { MoreVertical, Loader2 } from 'lucide-react';

/* ------------------------------------------------------------------------- */
/* DropdownMenu — the single row-action menu for the admin panel.             */
/* Owns: open state, click-outside, Escape + focus return, item tones,        */
/* dividers, disabled/locked rows, and the busy spinner on the trigger.       */
/* Feature code should NEVER hand-roll `relative` + `absolute right-0` again. */
/* ------------------------------------------------------------------------- */

export type DropdownMenuTone =
  | 'default'
  | 'danger'
  | 'critical'
  | 'warning'
  | 'info'
  | 'success'
  | 'purple'
  | 'blue'
  | 'primary';

export interface DropdownMenuItem {
  id: string;
  label: string;
  /** Leading icon. Pass the element, not the component: `<Eye size={14} />`. */
  icon?: React.ReactNode;
  tone?: DropdownMenuTone;
  onSelect?: () => void;
  disabled?: boolean;
  /** Tooltip / reason shown on hover — also how a locked row explains itself. */
  title?: string;
}

/** A divider row. */
export interface DropdownMenuSeparator {
  separator: true;
}

export type DropdownMenuEntry = DropdownMenuItem | DropdownMenuSeparator;

const ITEM_TONE_CLASSES: Record<DropdownMenuTone, string> = {
  default: 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
  danger: 'text-rose-600 hover:bg-rose-50',
  critical: 'text-red-600 hover:bg-red-50',
  warning: 'text-amber-600 hover:bg-amber-50',
  info: 'text-indigo-600 hover:bg-indigo-50',
  success: 'text-emerald-600 hover:bg-emerald-50',
  purple: 'text-purple-700 hover:bg-purple-50',
  blue: 'text-blue-600 hover:bg-blue-50',
  primary: 'text-primary hover:bg-primary-100/50',
};

// Note: no `pointer-events-none` — disabled buttons already swallow clicks, and
// keeping pointer events lets the `title` tooltip explain *why* a row is locked.
const DISABLED_CLASSES = 'text-gray-400 opacity-60 cursor-not-allowed';

export interface DropdownMenuProps {
  /** Ordered menu entries. Build this array declaratively (filter, spread). */
  entries: DropdownMenuEntry[];
  /** Accessible name for the trigger button. */
  label?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
  /** Shows a spinner instead of the trigger icon while a mutation is in flight. */
  isBusy?: boolean;
  className?: string;
  panelClassName?: string;
}

function isSeparator(entry: DropdownMenuEntry): entry is DropdownMenuSeparator {
  return 'separator' in entry;
}

/**
 * Row-actions menu. Selecting an item always closes the menu, so callers never
 * have to remember `setIsOpen(false)` after every handler — the most common
 * bug in the ten hand-rolled `*ActionsDropdown` components this replaces.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  entries,
  label = 'Row actions',
  align = 'right',
  disabled = false,
  isBusy = false,
  className = '',
  panelClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (item: DropdownMenuItem) => {
    setIsOpen(false);
    item.onSelect?.();
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={disabled || isBusy}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        title={label}
        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50"
      >
        {isBusy ? (
          <Loader2 size={18} className="animate-spin text-primary" />
        ) : (
          <MoreVertical size={18} />
        )}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className={`absolute mt-1 w-56 rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden z-50 transform origin-top transition-all duration-150 animate-in fade-in zoom-in-95 ${
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          } ${panelClassName}`}
        >
          <div className="p-1.5 space-y-1">
            {entries.map((entry, index) =>
              isSeparator(entry) ? (
                <div
                  key={`separator-${index}`}
                  className="h-px bg-gray-100 my-1 mx-2"
                  role="separator"
                />
              ) : (
                <button
                  key={entry.id}
                  type="button"
                  role="menuitem"
                  title={entry.title}
                  disabled={entry.disabled}
                  onClick={() => handleSelect(entry)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left rounded-xl transition-colors ${
                    entry.disabled ? DISABLED_CLASSES : ITEM_TONE_CLASSES[entry.tone ?? 'default']
                  }`}
                >
                  {entry.icon}
                  {entry.label}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
