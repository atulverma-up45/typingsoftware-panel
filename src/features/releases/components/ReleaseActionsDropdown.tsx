import React from 'react';
import { Download, Eye, Edit3, RefreshCw, Send, Trash2, Lock } from 'lucide-react';
import type { Release } from '../api/releaseApi';
import { usePermissions } from '@/lib/permissions';
import { DropdownMenu, type DropdownMenuEntry } from '@/components/ui/DropdownMenu';

interface ReleaseActionsDropdownProps {
  release: Release;
  onViewDetails: (release: Release) => void;
  onEdit: (release: Release) => void;
  onStatusChange: (release: Release) => void;
  onPublish: (id: string) => void;
  onDelete: (release: Release) => void;
}

export const ReleaseActionsDropdown: React.FC<ReleaseActionsDropdownProps> = ({
  release,
  onViewDetails,
  onEdit,
  onStatusChange,
  onPublish,
  onDelete,
}) => {
  // Canonical RBAC source — never derive role gates from the store directly
  const { isSuperAdmin } = usePermissions();

  /** Release management is SUPER_ADMIN-only: show the row, explain the lock. */
  const locked = (id: string, label: string, reason: string): DropdownMenuEntry => ({
    id,
    label,
    icon: <Lock size={13} className="text-gray-400" />,
    disabled: true,
    title: reason,
  });

  const handleDownload = () => {
    const downloadUrl = `/api/uploads/files/${encodeURIComponent(release.fileKey)}`;
    window.open(downloadUrl, '_blank');
  };

  const entries: DropdownMenuEntry[] = [
    {
      id: 'download',
      label: 'Download Installer',
      icon: <Download size={14} />,
      tone: 'success',
      onSelect: handleDownload,
    },
    {
      id: 'inspect',
      label: 'Inspect Specifications',
      icon: <Eye size={14} className="text-gray-500" />,
      onSelect: () => onViewDetails(release),
    },
  ];

  if (!isSuperAdmin) {
    entries.push(
      locked('edit', 'Edit Release (Locked)', 'Only Super Admin can edit software releases.'),
      locked('status', 'Status (Locked)', 'Only Super Admin can modify release lifecycle status.'),
      locked('delete', 'Delete (Locked)', 'Only Super Admin can delete software builds.'),
    );
  } else {
    entries.push(
      {
        id: 'edit',
        label: 'Edit Release',
        icon: <Edit3 size={14} />,
        tone: 'primary',
        onSelect: () => onEdit(release),
      },
      {
        id: 'status',
        label: 'Change Status',
        icon: <RefreshCw size={14} />,
        tone: 'blue',
        onSelect: () => onStatusChange(release),
      },
    );
    // Publishing is only meaningful for drafts already in the fleet.
    if (release.status === 'DRAFT') {
      entries.push({
        id: 'publish',
        label: 'Publish to Fleet',
        icon: <Send size={14} />,
        tone: 'success',
        onSelect: () => onPublish(release.id),
      });
    }
    entries.push(
      { separator: true },
      {
        id: 'delete',
        label: 'Delete Release',
        icon: <Trash2 size={14} />,
        tone: 'danger',
        onSelect: () => onDelete(release),
      },
    );
  }

  return <DropdownMenu entries={entries} label="Release actions" />;
};
