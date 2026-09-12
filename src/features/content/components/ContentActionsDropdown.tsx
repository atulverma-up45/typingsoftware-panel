import React from 'react';
import { Eye, Edit3, FileCheck2, Trash2, RotateCcw, Copy, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { ContentItem } from '../api/contentApi';
import { usePermissions } from '@/lib/permissions';
import { DropdownMenu, type DropdownMenuEntry } from '@/components/ui/DropdownMenu';

interface ContentActionsDropdownProps {
  item: ContentItem;
  onViewDetails: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onChangeStatus: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onRestore?: (item: ContentItem) => void;
  isDeletedView?: boolean;
}

/** Curriculum passages are centrally managed; non-super-admins get read-only rows. */
const LOCK_REASON = 'Curriculum passages are centrally managed by Super Admin. Read-only.';

export const ContentActionsDropdown: React.FC<ContentActionsDropdownProps> = ({
  item,
  onViewDetails,
  onEdit,
  onChangeStatus,
  onDelete,
  onRestore,
  isDeletedView = false,
}) => {
  // Canonical RBAC source — never derive role gates from the store directly
  const { isSuperAdmin } = usePermissions();

  const handleCopyText = () => {
    const text = item.payload?.text || '';
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success('Passage text copied to clipboard');
    } else {
      navigator.clipboard.writeText(item.id);
      toast.success('Content ID copied to clipboard');
    }
  };

  /**
   * Renders a locked row instead of hiding the action, so operators can see
   * what exists and why they cannot use it. No `pointer-events-none` — that
   * would suppress the very tooltip explaining the lock.
   */
  const locked = (id: string, label: string): DropdownMenuEntry => ({
    id,
    label,
    icon: <Lock size={13} className="text-gray-400" />,
    disabled: true,
    title: LOCK_REASON,
  });

  const entries: DropdownMenuEntry[] = [
    {
      id: 'inspect',
      label: 'Inspect Passage & Rules',
      icon: <Eye size={14} className="text-gray-400" />,
      onSelect: () => onViewDetails(item),
    },
    {
      id: 'copy-text',
      label: 'Copy Passage Text',
      icon: <Copy size={14} className="text-gray-400" />,
      onSelect: handleCopyText,
    },
  ];

  if (isDeletedView) {
    if (!isSuperAdmin) {
      entries.push(locked('restore', 'Restore (Locked)'));
    } else {
      if (onRestore) {
        entries.push({
          id: 'restore',
          label: 'Restore Content',
          icon: <RotateCcw size={14} />,
          tone: 'success',
          onSelect: () => onRestore(item),
        });
      }
      entries.push({
        id: 'purge',
        label: 'Permanently Purge',
        icon: <Trash2 size={14} />,
        tone: 'danger',
        onSelect: () => onDelete(item),
      });
    }
  } else if (!isSuperAdmin) {
    entries.push(
      locked('edit', 'Edit Passage (Locked)'),
      locked('status', 'Publish State (Locked)'),
      locked('trash', 'Move to Trash (Locked)'),
    );
  } else {
    entries.push(
      {
        id: 'edit',
        label: 'Edit Passage & Settings',
        icon: <Edit3 size={14} />,
        tone: 'blue',
        onSelect: () => onEdit(item),
      },
      {
        id: 'status',
        label: 'Change Publication State',
        icon: <FileCheck2 size={14} />,
        tone: 'primary',
        onSelect: () => onChangeStatus(item),
      },
      { separator: true },
      {
        id: 'trash',
        label: 'Move to Trash',
        icon: <Trash2 size={14} />,
        tone: 'danger',
        onSelect: () => onDelete(item),
      },
    );
  }

  return <DropdownMenu entries={entries} label="Content actions" />;
};
