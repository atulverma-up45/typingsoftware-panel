import React from 'react';
import {
  Eye,
  Edit3,
  CheckCircle2,
  XCircle,
  Sliders,
  Trash2,
  RotateCcw,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TypingModule } from '../api/moduleApi';
import { usePermissions } from '@/lib/permissions';
import {
  DropdownMenu,
  type DropdownMenuEntry,
} from '@/components/ui/DropdownMenu';

interface ModuleActionsDropdownProps {
  module: TypingModule;
  onViewDetails: (module: TypingModule) => void;
  onEdit: (module: TypingModule) => void;
  onToggleStatus: (module: TypingModule) => void;
  onConfigureOverride: (module: TypingModule) => void;
  onDelete: (module: TypingModule) => void;
  onRestore?: (module: TypingModule) => void;
  isDeletedView?: boolean;
}

export const ModuleActionsDropdown: React.FC<ModuleActionsDropdownProps> = ({
  module,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onConfigureOverride,
  onDelete,
  onRestore,
  isDeletedView = false,
}) => {
  // Canonical RBAC source — never derive role gates from the store directly
  const { canMutateModules, canConfigureModuleOverrides } = usePermissions();
  const isActive = module.status === 'ACTIVE';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(module.key);
    toast.success('Module key copied to clipboard');
  };

  const entries: DropdownMenuEntry[] = [
    {
      id: 'inspect',
      label: 'Inspect Specifications',
      icon: <Eye size={14} className="text-gray-400" />,
      onSelect: () => onViewDetails(module),
    },
    {
      id: 'copy-key',
      label: 'Copy Module Key',
      icon: <Copy size={14} className="text-gray-400" />,
      onSelect: handleCopyKey,
    },
  ];

  if (isDeletedView) {
    // Recycle-bin actions are SUPER_ADMIN-only (restore / permanent purge)
    if (canMutateModules) {
      if (onRestore) {
        entries.push({
          id: 'restore',
          label: 'Restore Module',
          icon: <RotateCcw size={14} />,
          tone: 'success',
          onSelect: () => onRestore(module),
        });
      }
      entries.push({
        id: 'purge',
        label: 'Permanently Purge',
        icon: <Trash2 size={14} />,
        tone: 'danger',
        onSelect: () => onDelete(module),
      });
    }
  } else {
    // Module CRUD is SUPER_ADMIN-only (POST/PATCH/DELETE /typing-modules)
    if (canMutateModules) {
      entries.push({
        id: 'edit',
        label: 'Edit Configuration',
        icon: <Edit3 size={14} />,
        tone: 'blue',
        onSelect: () => onEdit(module),
      });
    }

    // Tenant override accepts ADMIN too (POST /institutions/:id/modules)
    if (canConfigureModuleOverrides) {
      entries.push({
        id: 'override',
        label: 'Configure Tenant Override',
        icon: <Sliders size={14} />,
        tone: 'primary',
        onSelect: () => onConfigureOverride(module),
      });
    }

    if (canMutateModules) {
      entries.push(
        {
          id: 'toggle-status',
          label: isActive ? 'Deactivate Module' : 'Activate Module',
          icon: isActive ? (
            <XCircle size={14} className="text-gray-400" />
          ) : (
            <CheckCircle2 size={14} className="text-emerald-500" />
          ),
          onSelect: () => onToggleStatus(module),
        },
        { separator: true },
        {
          id: 'trash',
          label: 'Move to Trash',
          icon: <Trash2 size={14} />,
          tone: 'danger',
          onSelect: () => onDelete(module),
        },
      );
    }
  }

  return <DropdownMenu entries={entries} label="Module actions" />;
};
