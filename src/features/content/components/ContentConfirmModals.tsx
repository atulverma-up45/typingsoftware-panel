import React from 'react';
import { ConfirmDialog } from '@/components/ui/Modal';
import type { ContentItem } from '../api/contentApi';

interface ContentConfirmModalsProps {
  itemToDelete: ContentItem | null;
  itemToRestore: ContentItem | null;
  itemToPurge: ContentItem | null;
  isSoftDeletePending: boolean;
  isRestorePending: boolean;
  isPermanentDeletePending: boolean;
  onConfirmSoftDelete: () => void;
  onConfirmRestore: () => void;
  onConfirmPermanentPurge: () => void;
  onCloseDelete: () => void;
  onCloseRestore: () => void;
  onClosePurge: () => void;
}

export const ContentConfirmModals: React.FC<ContentConfirmModalsProps> = ({
  itemToDelete,
  itemToRestore,
  itemToPurge,
  isSoftDeletePending,
  isRestorePending,
  isPermanentDeletePending,
  onConfirmSoftDelete,
  onConfirmRestore,
  onConfirmPermanentPurge,
  onCloseDelete,
  onCloseRestore,
  onClosePurge,
}) => {
  return (
    <>
      {/* Confirmation: Soft Delete */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Move Content to Trash?"
        description={`Are you sure you want to move exercise "${itemToDelete?.title}" to trash? Historical student test scores will be preserved.`}
        confirmLabel="Move to Trash"
        variant="warning"
        isPending={isSoftDeletePending}
        onConfirm={onConfirmSoftDelete}
        onClose={onCloseDelete}
      />

      {/* Confirmation: Restore */}
      <ConfirmDialog
        isOpen={!!itemToRestore}
        title="Restore Content Item?"
        description={`Do you want to restore exercise "${itemToRestore?.title}" back to published catalog?`}
        confirmLabel="Restore Content"
        variant="info"
        isPending={isRestorePending}
        onConfirm={onConfirmRestore}
        onClose={onCloseRestore}
      />

      {/* Confirmation: Permanent Purge */}
      <ConfirmDialog
        isOpen={!!itemToPurge}
        title="Permanently Purge Content Item?"
        description={`WARNING: This action is permanent and cannot be undone. Content item "${itemToPurge?.title}" (${itemToPurge?.id}) will be permanently deleted from database records.`}
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

