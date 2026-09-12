import React from 'react';
import { Eye, Copy, Edit2, Power, AlertOctagon, Trash2, RotateCcw, Lock } from 'lucide-react';
import type { License } from '../api/licenseApi';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/permissions';
import { DropdownMenu, type DropdownMenuEntry } from '@/components/ui/DropdownMenu';

interface LicenseActionsDropdownProps {
  license: License;
  isSuperAdmin: boolean;
  onView: (lic: License) => void;
  onEdit: (lic: License) => void;
  onChangeStatus: (lic: License) => void;
  onRevoke: (lic: License) => void;
  onSoftDelete: (lic: License) => void;
  onRestore: (lic: License) => void;
  onPermanentDelete: (lic: License) => void;
}

/** Support is a read-only role: show the action, explain why it is unavailable. */
const LOCK_REASON = 'Support role is view-only';

export const LicenseActionsDropdown: React.FC<LicenseActionsDropdownProps> = ({
  license,
  isSuperAdmin,
  onView,
  onEdit,
  onChangeStatus,
  onRevoke,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
}) => {
  // Canonical RBAC source — never derive role gates from the store directly
  const { isSupport } = usePermissions();

  const isDeleted = !!license.deletedAt;
  const isRevoked = license.status === 'REVOKED';

  const locked = (id: string, label: string): DropdownMenuEntry => ({
    id,
    label,
    icon: <Lock size={13} className="text-gray-400" />,
    disabled: true,
    title: LOCK_REASON,
  });

  const handleCopyKey = () => {
    navigator.clipboard.writeText(license.licenseKey);
    toast.success('License key copied');
  };

  const entries: DropdownMenuEntry[] = [
    {
      id: 'inspect',
      label: 'Inspect License Dossier',
      icon: <Eye size={14} className="text-gray-400" />,
      onSelect: () => onView(license),
    },
    {
      id: 'copy-key',
      label: 'Copy License Key',
      icon: <Copy size={14} className="text-gray-400" />,
      onSelect: handleCopyKey,
    },
    isSupport
      ? locked('edit', 'Edit Capacity (Locked)')
      : {
          id: 'edit',
          label: 'Edit Seat Capacity',
          icon: <Edit2 size={14} className="text-gray-400" />,
          onSelect: () => onEdit(license),
        },
    { separator: true },
  ];

  if (isDeleted) {
    entries.push(
      isSupport
        ? locked('restore', 'Restore Key (Locked)')
        : {
            id: 'restore',
            label: 'Restore License',
            icon: <RotateCcw size={14} />,
            tone: 'info',
            onSelect: () => onRestore(license),
          },
    );
    // Permanent purge is irreversible — SUPER_ADMIN only, and never for Support.
    if (isSuperAdmin && !isSupport) {
      entries.push({
        id: 'purge',
        label: 'Permanently Purge',
        icon: <AlertOctagon size={14} />,
        tone: 'critical',
        onSelect: () => onPermanentDelete(license),
      });
    }
  } else {
    if (!isRevoked) {
      if (isSupport) {
        entries.push(
          locked('status', 'Status Toggle (Locked)'),
          locked('revoke', 'Revoke Key (Locked)'),
        );
      } else {
        entries.push(
          {
            id: 'status',
            label: license.status === 'ACTIVE' ? 'Suspend License' : 'Activate License',
            icon: <Power size={14} />,
            tone: 'warning',
            onSelect: () => onChangeStatus(license),
          },
          {
            id: 'revoke',
            label: 'Revoke License Immediately',
            icon: <AlertOctagon size={14} />,
            tone: 'critical',
            onSelect: () => onRevoke(license),
          },
        );
      }
    }
    entries.push(
      isSupport
        ? locked('trash', 'Move to Trash (Locked)')
        : {
            id: 'trash',
            label: 'Move to Trash',
            icon: <Trash2 size={14} />,
            tone: 'danger',
            onSelect: () => onSoftDelete(license),
          },
    );
  }

  return <DropdownMenu entries={entries} label="License Actions" />;
};
