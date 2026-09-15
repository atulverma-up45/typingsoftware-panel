import React from 'react';
import { ConfirmDialog } from '@/components/ui/Modal';
import type { Plan } from '../api/planApi';

interface PlanConfirmModalsProps {
  planToDelete: Plan | null;
  planToRestore: Plan | null;
  planToPurge: Plan | null;
  isSoftDeletePending: boolean;
  isRestorePending: boolean;
  isPermanentDeletePending: boolean;
  onCloseDelete: () => void;
  onCloseRestore: () => void;
  onClosePurge: () => void;
  onConfirmSoftDelete: () => void;
  onConfirmRestore: () => void;
  onConfirmPermanentPurge: () => void;
}

export const PlanConfirmModals: React.FC<PlanConfirmModalsProps> = ({
  planToDelete,
  planToRestore,
  planToPurge,
  isSoftDeletePending,
  isRestorePending,
  isPermanentDeletePending,
  onCloseDelete,
  onCloseRestore,
  onClosePurge,
  onConfirmSoftDelete,
  onConfirmRestore,
  onConfirmPermanentPurge,
}) => {
  return (
    <>
      {/* Confirmation: Soft Delete / Move to Trash */}
      <ConfirmDialog
        isOpen={!!planToDelete}
        title="Move Commercial Plan to Trash?"
        description={`Are you sure you want to move tier "${planToDelete?.name}" to trash? Existing active customer subscriptions will remain unaffected, but this plan will be removed from standard catalogs.`}
        confirmLabel="Move to Trash"
        variant="warning"
        isPending={isSoftDeletePending}
        onConfirm={onConfirmSoftDelete}
        onClose={onCloseDelete}
      />

      {/* Confirmation: Restore */}
      <ConfirmDialog
        isOpen={!!planToRestore}
        title="Restore Commercial Plan?"
        description={`Do you want to restore tier "${planToRestore?.name}" back to active status?`}
        confirmLabel="Restore Plan"
        variant="info"
        isPending={isRestorePending}
        onConfirm={onConfirmRestore}
        onClose={onCloseRestore}
      />

      {/* Confirmation: Permanent Purge */}
      <ConfirmDialog
        isOpen={!!planToPurge}
        title="Permanently Purge Commercial Plan?"
        description={`WARNING: This action is destructive and irreversible. Tier "${planToPurge?.name}" (${planToPurge?.id}) will be permanently deleted from the database.`}
        confirmLabel="Permanently Purge"
        variant="critical"
        confirmPhrase="DELETE"
        isPending={isPermanentDeletePending}
        onConfirm={onConfirmPermanentPurge}
        onClose={onClosePurge}
      />
    </>
  );
};

