import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  FileText,
  Palette,
  Laptop,
  Copy,
  Check,
  Code2,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { useSyncSimulator } from '../api/syncApi';
import type { SyncRequestInput, SyncResponse, OutboxItem } from '../api/syncApi';
import { toast } from 'sonner';

interface SyncDiagnosticSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncDiagnosticSimulatorModal: React.FC<SyncDiagnosticSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const syncSimulatorMutation = useSyncSimulator();

  // Form State
  const [licenseKey, setLicenseKey] = useState('');
  const [deviceId, setDeviceId] = useState('dev-workstation-lab-01');
  const [hardwareFingerprint, setHardwareFingerprint] = useState('FP-BFEBFBFF-000906EA-E45A');
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [configVersion, setConfigVersion] = useState(0);
  const [moduleVersion, setModuleVersion] = useState(0);
  const [contentVersion, setContentVersion] = useState(0);

  // Outbox items
  const [includeActivity, setIncludeActivity] = useState(true);

  // Simulation Result
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseKey.trim()) {
      toast.error('License key is required for sync simulation');
      return;
    }

    const outbox: OutboxItem[] = [];
    if (includeActivity) {
      outbox.push({
        id: `local_act_${Date.now()}`,
        institutionId: 'inst_pending_lookup',
        deviceId,
        entityType: 'DEVICE_ACTIVITY',
        operation: 'CREATE',
        payload: { event: 'WORKSTATION_STARTUP', os: 'Windows 11 Pro' },
        clientTimestamp: new Date().toISOString(),
        idempotencyKey: `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      });
    }

    const payload: SyncRequestInput = {
      licenseKey: licenseKey.trim(),
      deviceId: deviceId.trim(),
      hardwareFingerprint: hardwareFingerprint.trim(),
      appVersion: appVersion.trim(),
      clientTime: new Date().toISOString(),
      configVersion: Number(configVersion),
      moduleVersion: Number(moduleVersion),
      contentVersion: Number(contentVersion),
      outbox,
    };

    try {
      const response = await syncSimulatorMutation.mutateAsync(payload);
      setSyncResult(response);
      toast.success('Sync simulation executed successfully');
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  const handleCopyPayload = () => {
    if (!syncResult) return;
    navigator.clipboard.writeText(JSON.stringify(syncResult, null, 2));
    setCopiedPayload(true);
    toast.success('Server response JSON copied');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <RefreshCw size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Workstation Offline Synchronization Simulator
              </h2>
              <p className="text-xs text-gray-500">
                Simulate desktop client <code className="text-[11px] font-mono bg-gray-100 px-1 py-0.5 rounded">POST /api/v1/sync</code> delta exchange
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSimulate} className="p-6 border-b border-gray-100 bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                License Key *
              </label>
              <input
                type="text"
                required
                placeholder="TYP-XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white uppercase"
              />
              <p className="text-[10px] text-gray-400 mt-1">Identifies the licensed institution</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Workstation Device ID *
              </label>
              <input
                type="text"
                required
                placeholder="dev-workstation-lab-01"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Hardware Fingerprint *
              </label>
              <input
                type="text"
                required
                placeholder="FP-BFEBFBFF-000906EA-E45A"
                value={hardwareFingerprint}
                onChange={(e) => setHardwareFingerprint(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Client App Version
              </label>
              <input
                type="text"
                required
                placeholder="1.0.0"
                value={appVersion}
                onChange={(e) => setAppVersion(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white"
              />
            </div>
          </div>

          {/* Current Local Version Numbers (to test delta detection) */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-gray-100/70 border border-gray-200 mb-4 text-xs">
            <div>
              <label className="text-[11px] font-medium text-gray-600 block mb-1">
                Client Config Version
              </label>
              <input
                type="number"
                min={0}
                value={configVersion}
                onChange={(e) => setConfigVersion(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-600 block mb-1">
                Client Module Version
              </label>
              <input
                type="number"
                min={0}
                value={moduleVersion}
                onChange={(e) => setModuleVersion(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-600 block mb-1">
                Client Content Version
              </label>
              <input
                type="number"
                min={0}
                value={contentVersion}
                onChange={(e) => setContentVersion(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-mono"
              />
            </div>
          </div>

          {/* Simulated Outbox Queue */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeActivity}
                onChange={(e) => setIncludeActivity(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-gray-800">
                Include 1 Pending Outbox Item (DEVICE_ACTIVITY: WORKSTATION_STARTUP)
              </span>
            </label>
            <p className="text-[10px] text-gray-400 mt-0.5 pl-6">
              Simulates client pushing an idempotent device event to the cloud server.
            </p>
          </div>

          <button
            type="submit"
            disabled={syncSimulatorMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors disabled:opacity-50"
          >
            {syncSimulatorMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Executing Offline Delta Synchronization...
              </>
            ) : (
              <>
                <Play size={14} />
                Execute Sync Simulation
              </>
            )}
          </button>
        </form>

        {/* Results Body */}
        <div className="p-6 max-h-[45vh] overflow-y-auto">
          {syncSimulatorMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-semibold">Resolving delta changes from database...</p>
            </div>
          )}

          {syncResult && !syncSimulatorMutation.isPending && (
            <div className="space-y-4">
              {/* Verdict Banner */}
              <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">
                      Synchronization Protocol Completed: {syncResult.status}
                    </h4>
                    <p className="text-xs opacity-80 mt-0.5">
                      Server Cluster Timestamp: {new Date(syncResult.serverTime).toLocaleString()}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-600 text-white">
                  Resolved
                </span>
              </div>

              {/* Delta Matrix Summary */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                {/* Branding Config Delta */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 font-medium flex items-center gap-1">
                      <Palette size={13} className="text-purple-500" />
                      Config Delta
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        syncResult.configChanged
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {syncResult.configChanged ? 'UPDATED' : 'UP-TO-DATE'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    {syncResult.config ? 'Branding Payload Delivered' : 'No changes'}
                  </span>
                </div>

                {/* Modules Delta */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 font-medium flex items-center gap-1">
                      <Layers size={13} className="text-[#ff8a5c]" />
                      Modules Delta
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        syncResult.modulesChanged
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {syncResult.modulesChanged ? 'UPDATED' : 'UP-TO-DATE'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    {syncResult.modules?.length || 0} Modules Synced
                  </span>
                </div>

                {/* Content Delta */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 font-medium flex items-center gap-1">
                      <FileText size={13} className="text-emerald-500" />
                      Content Delta
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        syncResult.contentChanged
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {syncResult.contentChanged ? 'UPDATED' : 'UP-TO-DATE'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    {syncResult.content?.length || 0} Content Items
                  </span>
                </div>
              </div>

              {/* Outbox Execution Results */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <div className="font-bold text-gray-700 mb-1">Outbox Queue Resolution:</div>
                <div className="flex items-center gap-4 text-gray-600">
                  <span>
                    Accepted: <strong className="text-emerald-600">{syncResult.processedOutbox.acceptedIds.length}</strong>
                  </span>
                  <span>
                    Rejected/Ignored: <strong className="text-rose-600">{syncResult.processedOutbox.rejectedIds.length}</strong>
                  </span>
                </div>
              </div>

              {/* Raw JSON inspection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Code2 size={13} />
                    Complete Cloud Response Payload
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                  >
                    {copiedPayload ? (
                      <>
                        <Check size={12} className="text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy JSON
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-gray-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-[160px]">
                  {JSON.stringify(syncResult, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!syncResult && !syncSimulatorMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
              <Laptop size={36} className="text-gray-300 mb-2" />
              <p className="text-xs font-medium text-gray-500">
                Enter an active license key and click "Execute Sync Simulation" to test terminal sync behavior
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};

