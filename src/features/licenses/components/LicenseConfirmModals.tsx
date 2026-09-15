import React from 'react';
import type { License } from '../api/licenseApi';
import { ConfirmDialog } from '@/components/ui/Modal';

export interface LicenseConfirmModalsProps {
  softDeleteTarget: License | null;
  onCloseSoftDelete: () => void;
  onConfirmSoftDelete: () => void;
  isSoftDeleting: boolean;

  restoreTarget: License | null;
  onCloseRestore: () => void;
  onConfirmRestore: () => void;
  isRestoring: boolean;

  permanentDeleteTarget: License | null;
  onClosePermanentDelete: () => void;
  onConfirmPermanentDelete: () => void;
  isPermanentDeleting: boolean;
}

export const LicenseConfirmModals: React.FC<LicenseConfirmModalsProps> = ({
  softDeleteTarget,
  onCloseSoftDelete,
  onConfirmSoftDelete,
  isSoftDeleting,

  restoreTarget,
  onCloseRestore,
  onConfirmRestore,
  isRestoring,

  permanentDeleteTarget,
  onClosePermanentDelete,
  onConfirmPermanentDelete,
  isPermanentDeleting,
}) => {
  return (
    <>
      {/* Soft Delete to Trash Confirmation */}
      <ConfirmDialog
        isOpen={!!softDeleteTarget}
        title="Move License to Trash?"
        description={`Are you sure you want to move license "${softDeleteTarget?.licenseKey}" to the recycle bin? It will be archived and hidden from standard directory listings.`}
        confirmLabel="Move to Trash"
        variant="danger"
        isPending={isSoftDeleting}
        onClose={onCloseSoftDelete}
        onConfirm={onConfirmSoftDelete}
      />

      {/* Restore from Trash Confirmation */}
      <ConfirmDialog
        isOpen={!!restoreTarget}
        title="Restore License from Trash?"
        description={`Restore license "${restoreTarget?.licenseKey}" back to active directory?`}
        confirmLabel="Restore License"
        variant="info"
        isPending={isRestoring}
        onClose={onCloseRestore}
        onConfirm={onConfirmRestore}
      />

      {/* Permanent Purge Confirmation (with typed key safety!) */}
      <ConfirmDialog
        isOpen={!!permanentDeleteTarget}
        title="Permanently Purge License?"
        description={`This action is permanent and IRREVERSIBLE. All cryptographic records, hashes, and workstation activation links for key "${permanentDeleteTarget?.licenseKey}" will be destroyed forever.`}
        confirmLabel="Permanently Purge"
        variant="critical"
        confirmPhrase={permanentDeleteTarget?.licenseKey}
        isPending={isPermanentDeleting}
        onClose={onClosePermanentDelete}
        onConfirm={onConfirmPermanentDelete}
      />
    </>
  );
};

