import React, { useState } from 'react';
import { Monitor, Cpu, Layers } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useAuthStore } from '@/stores/auth.store';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { useActivationStats } from '../api/activationApi';
import { useDeviceStats } from '../api/deviceApi';
import { SeatsTabView } from '../components/SeatsTabView';
import { DevicesTabView } from '../components/DevicesTabView';

export type ViewMode = 'SEATS' | 'DEVICES';

export const ActivationsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Primary Dual-View Switch
  const [viewMode, setViewMode] = useState<ViewMode>('SEATS');

  // Common Institution Filter (Super Admin)
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const { data: institutionsData } = useInstitutions({
    limit: 100,
    status: 'ACTIVE',
  });
  const institutions = institutionsData?.data || [];

  const { data: activationStats } = useActivationStats(
    selectedInstitutionId || undefined,
  );
  const { data: deviceStats } = useDeviceStats(
    selectedInstitutionId || undefined,
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-6">
      {/* Top Header & View Mode Switch */}
      <PageHeader
        title="Workstation & Hardware Management"
        subtitle="Real-time telemetry, license slot governance, and physical desktop hardware fleet inventory"
        icon={<Monitor size={20} />}
        badge={
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary-100 text-primary rounded-full border border-primary/20">
            {viewMode === 'SEATS'
              ? 'Seat Activations'
              : 'Physical Hardware Fleet'}
          </span>
        }
        actions={
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('SEATS')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'SEATS'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Layers
                size={14}
                className={viewMode === 'SEATS' ? 'text-primary' : ''}
              />
              <span>License Seats</span>
              {activationStats && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-gray-100 text-gray-700 rounded-full">
                  {activationStats.totalActivations}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setViewMode('DEVICES')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'DEVICES'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Cpu
                size={14}
                className={viewMode === 'DEVICES' ? 'text-primary' : ''}
              />
              <span>Hardware Fleet</span>
              {deviceStats && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-gray-100 text-gray-700 rounded-full">
                  {deviceStats.totalDevices}
                </span>
              )}
            </button>
          </div>
        }
      />

      {/* VIEW 1: LICENSE SEAT ACTIVATIONS */}
      {viewMode === 'SEATS' && (
        <SeatsTabView
          selectedInstitutionId={selectedInstitutionId}
          setSelectedInstitutionId={setSelectedInstitutionId}
          institutions={institutions}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* VIEW 2: PHYSICAL HARDWARE DEVICE FLEET */}
      {viewMode === 'DEVICES' && (
        <DevicesTabView
          selectedInstitutionId={selectedInstitutionId}
          setSelectedInstitutionId={setSelectedInstitutionId}
          institutions={institutions}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
};

export default ActivationsPage;
