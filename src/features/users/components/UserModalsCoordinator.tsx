import React from 'react';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { UserDetailModal } from './UserDetailModal';
import { StatusChangeModal } from './StatusChangeModal';
import type { User } from '../api/userApi';

interface UserModalsCoordinatorProps {
  isCreateModalOpen: boolean;
  selectedUserForEdit: User | null;
  selectedUserForPassword: User | null;
  selectedUserForDetails: User | null;
  selectedUserForStatus: User | null;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onClosePassword: () => void;
  onCloseDetails: () => void;
  onCloseStatus: () => void;
  onSelectEdit: (user: User) => void;
  onSelectPassword: (user: User) => void;
  onSelectStatus: (user: User) => void;
}

export const UserModalsCoordinator: React.FC<UserModalsCoordinatorProps> = ({
  isCreateModalOpen,
  selectedUserForEdit,
  selectedUserForPassword,
  selectedUserForDetails,
  selectedUserForStatus,
  onCloseCreate,
  onCloseEdit,
  onClosePassword,
  onCloseDetails,
  onCloseStatus,
  onSelectEdit,
  onSelectPassword,
  onSelectStatus,
}) => {
  return (
    <>
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={onCloseCreate}
      />

      <EditUserModal
        user={selectedUserForEdit}
        isOpen={Boolean(selectedUserForEdit)}
        onClose={onCloseEdit}
      />

      <ResetPasswordModal
        user={selectedUserForPassword}
        isOpen={Boolean(selectedUserForPassword)}
        onClose={onClosePassword}
      />

      <UserDetailModal
        user={selectedUserForDetails}
        isOpen={Boolean(selectedUserForDetails)}
        onClose={onCloseDetails}
        onEdit={onSelectEdit}
        onResetPassword={onSelectPassword}
        onChangeStatus={onSelectStatus}
      />

      <StatusChangeModal
        user={selectedUserForStatus}
        isOpen={Boolean(selectedUserForStatus)}
        onClose={onCloseStatus}
      />
    </>
  );
};
