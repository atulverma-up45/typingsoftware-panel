import React from 'react';
import { Eye, Edit2, Palette, Power, Trash2, RotateCcw, AlertOctagon, Lock } from 'lucide-react';
import type { Institution } from '../api/institutionApi';
import { usePermissions } from '@/lib/permissions';
import { DropdownMenu, type DropdownMenuEntry } from '@/components/ui/DropdownMenu';

interface InstitutionActionsDropdownProps {
  institution: Institution;
  isSuperAdmin: boolean;
  onView: (inst: Institution) => void;
  onEdit: (inst: Institution) => void;
  onBranding: (inst: Institution) => void;
  onChangeStatus: (inst: Institution) => void;
  onSoftDelete: (inst: Institution) => void;
  onRestore: (inst: Institution) => void;
  onPermanentDelete: (inst: Institution) => void;
}

const SUPPORT_LOCK_REASON =
  'Support role is view-only. Modifications restricted to administrators.';

export const InstitutionActionsDropdown: React.FC<InstitutionActionsDropdownProps> = ({
  institution,
  isSuperAdmin,
  onView,
  onEdit,
  onBranding,
  onChangeStatus,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
}) => {
  // Canonical RBAC source — never derive role gates from the store directly
  const { isSupport } = usePermissions();

  const isDeleted = !!institution.deletedAt;

  /** Support is a read-only role: show the action, explain why it is unavailable. */
  const lockedBySupport = (id: string, label: string, reason?: string): DropdownMenuEntry => ({
    id,
    label,
    icon: <Lock size={13} className="text-gray-400" />,
    disabled: true,
    title: reason ?? SUPPORT_LOCK_REASON,
  });

  const entries: DropdownMenuEntry[] = [
    {
      id: 'view',
      label: 'View Full Dossier',
      icon: <Eye size={14} className="text-gray-400" />,
      onSelect: () => onView(institution),
    },
  ];

  if (isSupport) {
    entries.push(
      lockedBySupport('edit', 'Edit Profile (Locked)'),
      lockedBySupport(
        'branding',
        'Branding (Locked)',
        'Support role is view-only. Branding modifications restricted to administrators.',
      ),
    );
  } else {
    entries.push(
      {
        id: 'edit',
        label: 'Edit Profile',
        icon: <Edit2 size={14} className="text-gray-400" />,
        onSelect: () => onEdit(institution),
      },
      {
        id: 'branding',
        label: 'White-Label Branding',
        icon: <Palette size={14} />,
        tone: 'purple',
        onSelect: () => onBranding(institution),
      },
    );
  }

  // Lifecycle transitions (status / trash / restore / purge) are SUPER_ADMIN-only.
  if (isSuperAdmin) {
    entries.push({ separator: true });
    if (isDeleted) {
      entries.push(
        {
          id: 'restore',
          label: 'Restore Center',
          icon: <RotateCcw size={14} />,
          tone: 'info',
          onSelect: () => onRestore(institution),
        },
        {
          id: 'purge',
          label: 'Permanently Purge',
          icon: <AlertOctagon size={14} />,
          tone: 'critical',
          onSelect: () => onPermanentDelete(institution),
        },
      );
    } else {
      entries.push(
        {
          id: 'status',
          label: 'Change Status',
          icon: <Power size={14} />,
          tone: 'warning',
          onSelect: () => onChangeStatus(institution),
        },
        {
          id: 'trash',
          label: 'Move to Trash',
          icon: <Trash2 size={14} />,
          tone: 'danger',
          onSelect: () => onSoftDelete(institution),
        },
      );
    }
  }

  return <DropdownMenu entries={entries} label="Institution Actions" />;
};
