import React from 'react';
import {
  Edit3,
  Archive,
  RotateCcw,
  Trash2,
  Eye,
  CheckCircle2,
  Copy,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Plan } from '../api/planApi';
import { usePermissions } from '@/lib/permissions';
import {
  DropdownMenu,
  type DropdownMenuEntry,
} from '@/components/ui/DropdownMenu';

interface PlanActionsDropdownProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onToggleStatus: (plan: Plan) => void;
  onViewDetails: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onRestore?: (plan: Plan) => void;
  isDeletedView?: boolean;
}

export const PlanActionsDropdown: React.FC<PlanActionsDropdownProps> = ({
  plan,
  onEdit,
  onToggleStatus,
  onViewDetails,
  onDelete,
  onRestore,
  isDeletedView = false,
}) => {
  const { isSuperAdmin } = usePermissions();
  const isArchived = plan.status === 'ARCHIVED';

  const handleCopyId = () => {
    navigator.clipboard.writeText(plan.id);
    toast.success('Plan ID copied to clipboard');
  };

  /** A row that is visible but blocked, with the reason in its tooltip. */
  const locked = (
    id: string,
    label: string,
    reason: string,
  ): DropdownMenuEntry => ({
    id,
    label,
    icon: <Lock size={14} className="text-gray-400" />,
    disabled: true,
    title: reason,
  });

  const entries: DropdownMenuEntry[] = [
    {
      id: 'view',
      label: 'View Specifications',
      icon: <Eye size={14} className="text-gray-400" />,
      onSelect: () => onViewDetails(plan),
    },
    {
      id: 'copy-id',
      label: 'Copy Plan ID',
      icon: <Copy size={14} className="text-gray-400" />,
      onSelect: handleCopyId,
    },
  ];

  if (isDeletedView) {
    if (isSuperAdmin) {
      if (onRestore) {
        entries.push({
          id: 'restore',
          label: 'Restore Plan',
          icon: <RotateCcw size={14} />,
          tone: 'success',
          onSelect: () => onRestore(plan),
        });
      }
      entries.push({
        id: 'purge',
        label: 'Permanently Purge',
        icon: <Trash2 size={14} />,
        tone: 'danger',
        onSelect: () => onDelete(plan),
      });
    } else {
      entries.push(
        locked(
          'purge-locked',
          'Purge (Locked)',
          'Super Admin privileges required to purge commercial tiers.',
        ),
      );
    }
  } else if (isSuperAdmin) {
    entries.push(
      {
        id: 'edit',
        label: 'Edit Configuration',
        icon: <Edit3 size={14} className="text-blue-500" />,
        onSelect: () => onEdit(plan),
      },
      {
        id: 'toggle-status',
        label: isArchived ? 'Activate Tier' : 'Archive Tier',
        icon: isArchived ? (
          <CheckCircle2 size={14} className="text-emerald-500" />
        ) : (
          <Archive size={14} className="text-amber-500" />
        ),
        onSelect: () => onToggleStatus(plan),
      },
      { separator: true },
      {
        id: 'trash',
        label: 'Move to Trash',
        icon: <Trash2 size={14} />,
        tone: 'danger',
        onSelect: () => onDelete(plan),
      },
    );
  } else {
    entries.push(
      locked(
        'edit-locked',
        'Edit (Locked)',
        'Super Admin privileges required to edit commercial tiers.',
      ),
      locked(
        'status-locked',
        'Status (Locked)',
        'Super Admin privileges required to archive commercial tiers.',
      ),
      locked(
        'trash-locked',
        'Trash (Locked)',
        'Super Admin privileges required to delete commercial tiers.',
      ),
    );
  }

  return <DropdownMenu entries={entries} label="Plan actions" />;
};
