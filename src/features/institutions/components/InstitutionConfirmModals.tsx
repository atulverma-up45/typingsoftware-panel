import React from 'react';
import { ConfirmDialog } from '@/components/ui/Modal';
import type { Institution } from '../api/institutionApi';

interface InstitutionConfirmModalsProps {
  softDeleteTarget: Institution | null;
  restoreTarget: Institution | null;
  permanentDeleteTarget: Institution | null;
  isSoftDeletePending: boolean;
  isRestorePending: boolean;
  isPermanentDeletePending: boolean;
  onCloseSoftDelete: () => void;
  onCloseRestore: () => void;
  onClosePermanentDelete: () => void;
  onConfirmSoftDelete: () => void;
  onConfirmRestore: () => void;
  onConfirmPermanentDelete: () => void;
}

export const InstitutionConfirmModals: React.FC<InstitutionConfirmModalsProps> = ({
  softDeleteTarget,
  restoreTarget,
  permanentDeleteTarget,
  isSoftDeletePending,
  isRestorePending,
  isPermanentDeletePending,
  onCloseSoftDelete,
  onCloseRestore,
  onClosePermanentDelete,
  onConfirmSoftDelete,
  onConfirmRestore,
  onConfirmPermanentDelete,
}) => {
  return (
    <>
      {/* Soft Delete (Move to Trash) Confirmation */}
      <ConfirmDialog
        isOpen={!!softDeleteTarget}
        title="Move Institution to Trash?"
        description={`Are you sure you want to move "${softDeleteTarget?.name}" to the recycle bin? Its active authentications will be temporarily disabled, but you can restore it at any time.`}
        confirmLabel="Move to Trash"
        variant="danger"
        isPending={isSoftDeletePending}
        onClose={onCloseSoftDelete}
        onConfirm={onConfirmSoftDelete}
      />

      {/* Restore from Trash Confirmation */}
      <ConfirmDialog
        isOpen={!!restoreTarget}
        title="Restore Institution from Trash?"
        description={`Restore "${restoreTarget?.name}" back to Active status? The center will immediately regain access to its licenses and tenant configurations.`}
        confirmLabel="Restore Institution"
        variant="info"
        isPending={isRestorePending}
        onClose={onCloseRestore}
        onConfirm={onConfirmRestore}
      />

      {/* Permanent Purge Confirmation */}
      <ConfirmDialog
        isOpen={!!permanentDeleteTarget}
        title="Permanently Purge Institution?"
        description={`This action is permanent and IRREVERSIBLE. All student records, licenses, device links, and branding assets for "${permanentDeleteTarget?.name}" will be wiped out completely.`}
        confirmLabel="Permanently Purge"
        variant="critical"
        confirmPhrase={permanentDeleteTarget?.slug}
        isPending={isPermanentDeletePending}
        onClose={onClosePermanentDelete}
        onConfirm={onConfirmPermanentDelete}
      />
    </>
  );
};

