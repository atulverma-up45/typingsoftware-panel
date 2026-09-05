import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
  Package,
  Layers,
  Cpu,
  FileCode,
  Code2,
  Loader2,
  Laptop,
  Copy,
  Check,
} from 'lucide-react';
import { useLatestReleaseSimulator } from '../api/releaseApi';
import type { ReleasePlatform, ReleaseChannel } from '../api/releaseApi';
import { toast } from 'sonner';

interface ClientUpdateSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientUpdateSimulatorModal: React.FC<ClientUpdateSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [platform, setPlatform] = useState<ReleasePlatform>('windows-x64');
  const [channel, setChannel] = useState<ReleaseChannel>('stable');
  const [currentVersion, setCurrentVersion] = useState('1.0.0');
  const [licenseKey, setLicenseKey] = useState('');
  const [hasQueried, setHasQueried] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const { data, isLoading, error, refetch } = useLatestReleaseSimulator(
    {
      platform,
      channel,
      currentVersion: currentVersion.trim() || undefined,
      licenseKey: licenseKey.trim() || undefined,
    },
    hasQueried
  );

  if (!isOpen) return null;

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setHasQueried(true);
    refetch();
  };

  const handleCopyPayload = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedPayload(true);
    toast.success('Response JSON copied to clipboard');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Laptop size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Desktop Client Auto-Updater Simulator
              </h2>
              <p className="text-xs text-gray-500">
                Simulate <code className="text-[11px] font-mono bg-gray-100 px-1 py-0.5 rounded">GET /api/v1/releases/latest</code> requests from workstation clients
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

        {/* Form Controls */}
        <form onSubmit={handleSimulate} className="p-6 border-b border-gray-100 bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Client Architecture
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as ReleasePlatform)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white"
              >
                <option value="windows-x64">Windows (64-bit x64)</option>
                <option value="windows-arm64">Windows (ARM64)</option>
                <option value="windows-x86">Windows (32-bit x86)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Distribution Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ReleaseChannel)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white"
              >
                <option value="stable">Stable Channel</option>
                <option value="beta">Beta Channel</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Workstation Current Version
              </label>
              <input
                type="text"
                placeholder="1.0.0"
                value={currentVersion}
                onChange={(e) => setCurrentVersion(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Simulated License Key (Optional)
              </label>
              <input
                type="text"
                placeholder="TYP-XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff8a5c] bg-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-xs transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Querying Auto-Updater Endpoint...
              </>
            ) : (
              <>
                <Play size={14} />
                Run Diagnostic Simulation
              </>
            )}
          </button>
        </form>

        {/* Results Body */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Loader2 size={32} className="animate-spin text-purple-600 mb-2" />
              <p className="text-xs font-semibold">Testing auto-updater response...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No published release found or error returned</p>
                <p className="text-[11px] mt-0.5 text-rose-700">
                  {(error as any)?.response?.data?.message || (error as any)?.message || 'Make sure there is at least one PUBLISHED release for this channel and platform.'}
                </p>
              </div>
            </div>
          )}

          {data && !isLoading && (
            <div className="space-y-4">
              {/* Verdict Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  data.upgradeRequired
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : data.updateAvailable
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {data.upgradeRequired ? (
                    <AlertTriangle size={24} className="text-rose-600 shrink-0" />
                  ) : data.updateAvailable ? (
                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  ) : (
                    <Laptop size={24} className="text-blue-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold">
                      {data.upgradeRequired
                        ? 'Mandatory Upgrade Enforced!'
                        : data.updateAvailable
                        ? 'New Version Available for Download'
                        : 'Workstation is Up to Date'}
                    </h4>
                    <p className="text-xs opacity-80 mt-0.5">
                      Client Version: <strong className="font-mono">v{currentVersion || 'unknown'}</strong> → Latest Cloud: <strong className="font-mono">v{data.version}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      data.upgradeRequired
                        ? 'bg-rose-600 text-white'
                        : data.updateAvailable
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {data.upgradeRequired
                      ? 'Action Required'
                      : data.updateAvailable
                      ? 'Update Ready'
                      : 'Compliant'}
                  </span>
                </div>
              </div>

              {/* Specs Summary */}
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">Cloud Version</span>
                  <span className="font-bold text-gray-800">v{data.version}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">Package Size</span>
                  <span className="font-bold text-gray-800">{formatBytes(data.fileSize)}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">Min Supported</span>
                  <span className="font-bold text-gray-800">v{data.minSupportedVersion}</span>
                </div>
              </div>

              {/* Download link preview */}
              {data.downloadUrl && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                  <div className="truncate mr-2">
                    <span className="text-gray-400 block text-[10px]">Client Download URL</span>
                    <span className="font-mono text-gray-700 truncate block">
                      {data.downloadUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(data.downloadUrl, '_blank')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/80 transition-colors shrink-0"
                  >
                    <Download size={13} />
                    Test Link
                  </button>
                </div>
              )}

              {/* Raw JSON inspection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Code2 size={13} />
                    Raw Client Payload
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline"
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
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!hasQueried && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <Laptop size={36} className="text-gray-300 mb-2" />
              <p className="text-xs font-medium text-gray-500">
                Configure workstation query parameters above and click "Run Diagnostic Simulation"
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

