import React from 'react';
import type { Subscription } from '../api/subscriptionApi';
import { ConfirmDialog } from '@/components/ui/Modal';

export interface SubscriptionConfirmModalsProps {
  subscriptionToDelete: Subscription | null;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;

  subscriptionToRestore: Subscription | null;
  onCloseRestore: () => void;
  onConfirmRestore: () => void;
  isRestoring: boolean;

  subscriptionToPurge: Subscription | null;
  onClosePurge: () => void;
  onConfirmPurge: () => void;
  isPurging: boolean;
}

export const SubscriptionConfirmModals: React.FC<SubscriptionConfirmModalsProps> = ({
  subscriptionToDelete,
  onCloseDelete,
  onConfirmDelete,
  isDeleting,

  subscriptionToRestore,
  onCloseRestore,
  onConfirmRestore,
  isRestoring,

  subscriptionToPurge,
  onClosePurge,
  onConfirmPurge,
  isPurging,
}) => {
  return (
    <>
      {/* Confirmation: Soft Delete */}
      <ConfirmDialog
        isOpen={!!subscriptionToDelete}
        title="Move Subscription to Trash?"
        description={`Are you sure you want to cancel / move subscription "${subscriptionToDelete?.id}" to trash? Associated client licenses may be impacted.`}
        confirmLabel="Move to Trash"
        variant="warning"
        isPending={isDeleting}
        onConfirm={onConfirmDelete}
        onClose={onCloseDelete}
      />

      {/* Confirmation: Restore */}
      <ConfirmDialog
        isOpen={!!subscriptionToRestore}
        title="Restore Subscription Contract?"
        description={`Do you want to restore subscription "${subscriptionToRestore?.id}" back to active status?`}
        confirmLabel="Restore Contract"
        variant="info"
        isPending={isRestoring}
        onConfirm={onConfirmRestore}
        onClose={onCloseRestore}
      />

      {/* Confirmation: Permanent Purge */}
      <ConfirmDialog
        isOpen={!!subscriptionToPurge}
        title="Permanently Purge Subscription?"
        description={`WARNING: This action is permanent and cannot be undone. Subscription contract "${subscriptionToPurge?.id}" will be purged from database records.`}
        confirmLabel="Permanently Purge"
        variant="critical"
        confirmPhrase="DELETE"
        isPending={isPurging}
        onConfirm={onConfirmPurge}
        onClose={onClosePurge}
      />
    </>
  );
};

