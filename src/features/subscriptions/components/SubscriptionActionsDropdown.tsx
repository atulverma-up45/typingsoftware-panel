import React from 'react';
import { RotateCw, Edit3, ShieldAlert, Trash2, Eye, RotateCcw, Copy, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { Subscription } from '../api/subscriptionApi';
import { usePermissions } from '@/lib/permissions';
import { DropdownMenu, type DropdownMenuEntry } from '@/components/ui/DropdownMenu';

interface SubscriptionActionsDropdownProps {
  subscription: Subscription;
  onViewDetails: (subscription: Subscription) => void;
  onRenew: (subscription: Subscription) => void;
  onEdit: (subscription: Subscription) => void;
  onChangeStatus: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
  onRestore?: (subscription: Subscription) => void;
  isDeletedView?: boolean;
}

const PURGE_LOCK_REASON = 'Permanent purge requires Super Admin privileges.';

export const SubscriptionActionsDropdown: React.FC<SubscriptionActionsDropdownProps> = ({
  subscription,
  onViewDetails,
  onRenew,
  onEdit,
  onChangeStatus,
  onDelete,
  onRestore,
  isDeletedView = false,
}) => {
  // Canonical RBAC source — never derive role gates from the store directly
  const { isSuperAdmin, isSupport } = usePermissions();

  /** Support is a read-only role: show the action, explain why it is unavailable. */
  const lockedBySupport = (id: string, label: string, reason: string): DropdownMenuEntry => ({
    id,
    label,
    icon: <Lock size={13} className="text-gray-400" />,
    disabled: true,
    title: `Support role is view-only. ${reason}`,
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(subscription.id);
    toast.success('Subscription ID copied to clipboard');
  };

  const entries: DropdownMenuEntry[] = [
    {
      id: 'inspect',
      label: 'Inspect Contract Dossier',
      icon: <Eye size={14} className="text-gray-400" />,
      onSelect: () => onViewDetails(subscription),
    },
    {
      id: 'copy-id',
      label: 'Copy Subscription ID',
      icon: <Copy size={14} className="text-gray-400" />,
      onSelect: handleCopyId,
    },
  ];

  if (isDeletedView) {
    if (isSupport) {
      entries.push(
        lockedBySupport('restore', 'Restore (Locked)', 'Subscription restore restricted to administrators.'),
      );
    } else {
      if (onRestore) {
        entries.push({
          id: 'restore',
          label: 'Restore Subscription',
          icon: <RotateCcw size={14} />,
          tone: 'success',
          onSelect: () => onRestore(subscription),
        });
      }
      entries.push(
        isSuperAdmin
          ? {
              id: 'purge',
              label: 'Permanently Purge',
              icon: <Trash2 size={14} />,
              tone: 'critical',
              onSelect: () => onDelete(subscription),
            }
          : {
              id: 'purge',
              label: 'Purge (Locked)',
              icon: <Lock size={13} className="text-gray-400" />,
              disabled: true,
              title: PURGE_LOCK_REASON,
            },
      );
    }
  } else if (isSupport) {
    entries.push(
      lockedBySupport('renew', 'Renew (Locked)', 'Contract renewals restricted to administrators.'),
      lockedBySupport('edit', 'Edit Expiry (Locked)', 'Contract edits restricted to administrators.'),
      lockedBySupport('status', 'Status (Locked)', 'Status transitions restricted to administrators.'),
      lockedBySupport(
        'trash',
        'Move to Trash (Locked)',
        'Subscriptions deletion restricted to administrators.',
      ),
    );
  } else {
    entries.push(
      {
        id: 'renew',
        label: 'Renew Contract',
        icon: <RotateCw size={14} />,
        tone: 'primary',
        onSelect: () => onRenew(subscription),
      },
      {
        id: 'edit',
        label: 'Edit Expiry & Auto-Renew',
        icon: <Edit3 size={14} />,
        tone: 'blue',
        onSelect: () => onEdit(subscription),
      },
      {
        id: 'status',
        label: 'Transition Status',
        icon: <ShieldAlert size={14} />,
        tone: 'warning',
        onSelect: () => onChangeStatus(subscription),
      },
      { separator: true },
      {
        id: 'trash',
        label: 'Move to Trash',
        icon: <Trash2 size={14} />,
        tone: 'danger',
        onSelect: () => onDelete(subscription),
      },
    );
  }

  return <DropdownMenu entries={entries} label="Subscription actions" />;
};
