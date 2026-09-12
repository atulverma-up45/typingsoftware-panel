import React from 'react';
import { Eye, Edit3, RefreshCw, ShieldAlert, Trash2, RotateCcw, Lock } from 'lucide-react';
import type { Device } from '../api/deviceApi';
import { usePermissions } from '@/lib/permissions';
import { DropdownMenu, type DropdownMenuEntry } from '@/components/ui/DropdownMenu';

interface DeviceActionsDropdownProps {
  device: Device;
  onViewDetails: (device: Device) => void;
  onEdit: (device: Device) => void;
  onStatusChange: (device: Device) => void;
  onRevoke: (device: Device) => void;
  onDelete: (device: Device) => void;
  onRestore?: (device: Device) => void;
  isDeleted?: boolean;
}

const SUPPORT_LOCK_REASON = 'Support role is view-only';
const PURGE_LOCK_REASON = 'Permanent deletion requires Super Admin privileges.';

export const DeviceActionsDropdown: React.FC<DeviceActionsDropdownProps> = ({
  device,
  onViewDetails,
  onEdit,
  onStatusChange,
  onRevoke,
  onDelete,
  onRestore,
  isDeleted = false,
}) => {
  // Canonical RBAC source — never derive role gates from the store directly
  const { isSupport, isSuperAdmin } = usePermissions();

  /** Support is a read-only role: show the action, explain why it is unavailable. */
  const lockedBySupport = (id: string, label: string): DropdownMenuEntry => ({
    id,
    label,
    icon: <Lock size={13} className="text-gray-400" />,
    disabled: true,
    title: SUPPORT_LOCK_REASON,
  });

  const entries: DropdownMenuEntry[] = [
    {
      id: 'inspect',
      label: 'Inspect Hardware',
      icon: <Eye size={14} className="text-gray-500" />,
      onSelect: () => onViewDetails(device),
    },
  ];

  if (isDeleted) {
    if (isSupport) {
      entries.push(lockedBySupport('restore', 'Restore (Locked)'));
    } else {
      if (onRestore) {
        entries.push({
          id: 'restore',
          label: 'Restore Device',
          icon: <RotateCcw size={14} />,
          tone: 'success',
          onSelect: () => onRestore(device),
        });
      }
      entries.push({ separator: true });
      entries.push(
        isSuperAdmin
          ? {
              id: 'purge',
              label: 'Purge Permanently',
              icon: <Trash2 size={14} />,
              tone: 'critical',
              onSelect: () => onDelete(device),
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
      lockedBySupport('edit', 'Edit Label (Locked)'),
      lockedBySupport('status', 'Status (Locked)'),
      lockedBySupport('revoke', 'Revoke (Locked)'),
      lockedBySupport('trash', 'Trash (Locked)'),
    );
  } else {
    entries.push({
      id: 'edit',
      label: 'Edit Room / Label',
      icon: <Edit3 size={14} />,
      tone: 'primary',
      onSelect: () => onEdit(device),
    });
    entries.push({
      id: 'status',
      label: 'Change Status',
      icon: <RefreshCw size={14} />,
      tone: 'purple',
      onSelect: () => onStatusChange(device),
    });
    if (device.status !== 'REVOKED') {
      entries.push({
        id: 'revoke',
        label: 'Revoke Access',
        icon: <ShieldAlert size={14} />,
        tone: 'warning',
        onSelect: () => onRevoke(device),
      });
    }
    entries.push({ separator: true });
    entries.push({
      id: 'trash',
      label: 'Move to Trash',
      icon: <Trash2 size={14} />,
      tone: 'danger',
      onSelect: () => onDelete(device),
    });
  }

  return <DropdownMenu entries={entries} label="Workstation actions" />;
};
