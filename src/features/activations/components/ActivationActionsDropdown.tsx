import React from 'react';
import { Eye, Copy, Cpu, PauseCircle, PlayCircle, AlertOctagon, Lock } from 'lucide-react';
import type { Activation } from '../api/activationApi';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/permissions';
import { DropdownMenu, type DropdownMenuEntry } from '@/components/ui/DropdownMenu';

interface ActivationActionsDropdownProps {
  activation: Activation;
  onView: (act: Activation) => void;
  onDeactivate: (act: Activation) => void;
  onReactivate: (act: Activation) => void;
  onRevoke: (act: Activation) => void;
}

const LOCK_REASON =
  'Support role is view-only. Workstation seats management is restricted to administrators.';

export const ActivationActionsDropdown: React.FC<ActivationActionsDropdownProps> = ({
  activation,
  onView,
  onDeactivate,
  onReactivate,
  onRevoke,
}) => {
  // Canonical RBAC source — never derive role gates from the store directly
  const { isSupport } = usePermissions();

  const handleCopyUUID = () => {
    navigator.clipboard.writeText(activation.deviceId);
    toast.success('Device UUID copied');
  };

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(activation.hardwareFingerprint);
    toast.success('Hardware fingerprint copied');
  };

  const entries: DropdownMenuEntry[] = [
    {
      id: 'inspect',
      label: 'Inspect Station Dossier',
      icon: <Eye size={14} className="text-gray-400" />,
      onSelect: () => onView(activation),
    },
    {
      id: 'copy-uuid',
      label: 'Copy Device UUID',
      icon: <Copy size={14} className="text-gray-400" />,
      onSelect: handleCopyUUID,
    },
    {
      id: 'copy-fingerprint',
      label: 'Copy Hardware Fingerprint',
      icon: <Cpu size={14} className="text-gray-400" />,
      onSelect: handleCopyFingerprint,
    },
    { separator: true },
  ];

  if (isSupport) {
    entries.push({
      id: 'seat-management',
      label: 'Seat Management (Locked)',
      icon: <Lock size={13} className="text-gray-400" />,
      disabled: true,
      title: LOCK_REASON,
    });
  } else {
    // Seat transitions are mutually exclusive: only the one that applies is shown.
    if (activation.status === 'ACTIVE') {
      entries.push({
        id: 'deactivate',
        label: 'Deactivate Seat Slot',
        icon: <PauseCircle size={14} />,
        tone: 'warning',
        onSelect: () => onDeactivate(activation),
      });
    }
    if (activation.status === 'DEACTIVATED') {
      entries.push({
        id: 'reactivate',
        label: 'Reactivate Seat',
        icon: <PlayCircle size={14} />,
        tone: 'success',
        onSelect: () => onReactivate(activation),
      });
    }
    if (activation.status !== 'REVOKED') {
      entries.push({
        id: 'revoke',
        label: 'Revoke & Blacklist',
        icon: <AlertOctagon size={14} />,
        tone: 'critical',
        onSelect: () => onRevoke(activation),
      });
    }
  }

  return <DropdownMenu entries={entries} label="Workstation Actions" />;
};
