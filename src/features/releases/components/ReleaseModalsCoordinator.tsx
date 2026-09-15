import React from 'react';
import { CreateReleaseModal } from './CreateReleaseModal';
import { EditReleaseModal } from './EditReleaseModal';
import { ReleaseDetailModal } from './ReleaseDetailModal';
import { ReleaseStatusModal } from './ReleaseStatusModal';
import { ClientUpdateSimulatorModal } from './ClientUpdateSimulatorModal';
import { ConfirmDialog } from '@/components/ui/Modal';
import type { Release } from '../api/releaseApi';

interface ReleaseModalsCoordinatorProps {
  isCreateModalOpen: boolean;
  isSimulatorModalOpen: boolean;
  editingRelease: Release | null;
  inspectingRelease: Release | null;
  statusRelease: Release | null;
  releaseToDelete: Release | null;
  onCloseCreate: () => void;
  onCloseSimulator: () => void;
  onCloseEdit: () => void;
  onCloseDetails: () => void;
  onCloseStatus: () => void;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
}

export const ReleaseModalsCoordinator: React.FC<ReleaseModalsCoordinatorProps> = ({
  isCreateModalOpen,
  isSimulatorModalOpen,
  editingRelease,
  inspectingRelease,
  statusRelease,
  releaseToDelete,
  onCloseCreate,
  onCloseSimulator,
  onCloseEdit,
  onCloseDetails,
  onCloseStatus,
  onCloseDelete,
  onConfirmDelete,
}) => {
  return (
    <>
      <CreateReleaseModal
        isOpen={isCreateModalOpen}
        onClose={onCloseCreate}
      />

      <EditReleaseModal
        isOpen={!!editingRelease}
        onClose={onCloseEdit}
        release={editingRelease}
      />

      <ReleaseDetailModal
        isOpen={!!inspectingRelease}
        onClose={onCloseDetails}
        release={inspectingRelease}
      />

      <ReleaseStatusModal
        isOpen={!!statusRelease}
        onClose={onCloseStatus}
        release={statusRelease}
      />

      <ClientUpdateSimulatorModal
        isOpen={isSimulatorModalOpen}
        onClose={onCloseSimulator}
      />

      <ConfirmDialog
        isOpen={!!releaseToDelete}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        title="Delete Software Release"
        description={`Are you sure you want to delete release v${releaseToDelete?.version || ''}? Workstations querying this version will no longer be able to download the installer.`}
        confirmLabel="Permanently Delete"
        variant="critical"
        confirmPhrase="DELETE"
      />
    </>
  );
};

