import React, { useState, useEffect } from 'react';
import {
  X,
  Laptop,
  Smartphone,
  Shield,
  Clock,
  MapPin,
  Globe,
  Trash2,
  CheckCircle2,
  XCircle,
  History,
  Radio,
  Calendar,
  Layers,
  Copy,
  Check,
  Building,
  KeyRound,
  Edit,
  Loader2,
  Tablet,
  Monitor,
} from 'lucide-react';
import {
  type User,
  useUser,
  useUserSessions,
  useUserLoginHistory,
  useRevokeUserSession,
  useRevokeAllUserSessions,
  useInstitutionMap,
  type UserSession,
} from '../api/userApi';
import { ConfirmationModal } from './ConfirmationModal';
import { toast } from 'sonner';

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (user: User) => void;
  onResetPassword?: (user: User) => void;
  onChangeStatus?: (user: User) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user: initialUser,
  isOpen,
  onClose,
  onEdit,
  onResetPassword,
  onChangeStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'history'>('overview');
  const [copiedId, setCopiedId] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Institutions lookup map
  const { institutionMap } = useInstitutionMap(isOpen);

  // Confirmation modal state
  const [sessionToRevoke, setSessionToRevoke] = useState<UserSession | null>(null);
  const [isConfirmingRevokeAll, setIsConfirmingRevokeAll] = useState(false);

  // Fetch live fresh user data
  const { data: userResponse, isLoading: isLoadingUser } = useUser(
    isOpen && initialUser ? initialUser.id : null,
  );
  const user = userResponse?.data || initialUser;

  // Active sessions query (GET /users/:id/sessions)
  const {
    data: sessionsResponse,
    isLoading: isLoadingSessions,
  } = useUserSessions(isOpen && user ? user.id : null);
  const sessions = sessionsResponse?.data?.sessions || [];

  // Login history query (GET /users/:id/login-history)
  const {
    data: historyResponse,
    isLoading: isLoadingHistory,
  } = useUserLoginHistory(isOpen && user ? user.id : null, 50);
  const history = historyResponse?.data || [];

  // Mutations
  const { mutate: revokeSession, isPending: isRevokingSession } = useRevokeUserSession();
  const { mutate: revokeAllSessions, isPending: isRevokingAll } = useRevokeAllUserSessions();

  if (!isOpen || !user) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    toast.success('User ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone size={18} className="text-indigo-500" />;
      case 'tablet':
        return <Tablet size={18} className="text-indigo-500" />;
      case 'desktop':
        return <Monitor size={18} className="text-indigo-500" />;
      default:
        return <Laptop size={18} className="text-indigo-500" />;
    }
  };

  const getStatusBadge = () => {
    if (user.deletedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          DELETED (TRASH)
        </span>
      );
    }
    switch (user.status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ACTIVE
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> SUSPENDED
          </span>
        );
      case 'BANNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> BANNED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> {user.status}
          </span>
        );
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative w-full max-w-3xl bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#ffb48b] to-[#f89c6d] flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                  {getStatusBadge()}
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>{user.email}</span>
                  {user.emailVerified && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 size={13} /> Verified
                    </span>
                  )}
                  <span>•</span>
                  <button
                    onClick={handleCopyId}
                    className="flex items-center gap-1 hover:text-gray-800 font-mono text-[11px] hover:underline"
                    title="Copy User ID"
                  >
                    {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {user.id.substring(0, 8)}...
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100 px-6 bg-white">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#ff8a5c] text-[#ff8a5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Layers size={15} /> Overview & Profile
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'sessions'
                  ? 'border-[#ff8a5c] text-[#ff8a5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Radio size={15} /> Active Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-[#ff8a5c] text-[#ff8a5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <History size={15} /> Login Audit ({history.length})
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {isLoadingUser ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 size={28} className="animate-spin text-[#ff8a5c]" />
                <p className="text-xs text-gray-500">Loading user profile...</p>
              </div>
            ) : activeTab === 'overview' ? (
              <div className="space-y-6">
                {/* Profile Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Full Legal Name
                    </span>
                    <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Primary Email
                    </span>
                    <p className="text-sm font-semibold text-gray-800">{user.email}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Assigned Institution
                    </span>
                    <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      <Building size={14} className="text-gray-400 shrink-0" />
                      {user.institutionId ? (
                        institutionMap.get(user.institutionId) ? (
                          <span>
                            {institutionMap.get(user.institutionId)!.name}{' '}
                            <span className="text-xs text-gray-400 font-mono">
                              ({institutionMap.get(user.institutionId)!.slug})
                            </span>
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-indigo-700">
                            {user.institutionId}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 italic">Global Platform (Unassigned)</span>
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Account Registered On
                    </span>
                    <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(user.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-100">
                  <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-3">
                    Administrative Quick Actions
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => {
                        onClose();
                        onEdit?.(user);
                      }}
                      className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Edit size={14} className="text-blue-500" /> Edit Profile Details
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onChangeStatus?.(user);
                      }}
                      className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Shield size={14} className="text-orange-500" /> Change Status
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onResetPassword?.(user);
                      }}
                      className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <KeyRound size={14} className="text-amber-500" /> Reset Password
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTab === 'sessions' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Active Device Sessions</h3>
                    <p className="text-xs text-gray-500">
                      Devices currently holding active, valid authentication tokens.
                    </p>
                  </div>
                  {sessions.length > 0 && (
                    <button
                      onClick={() => setIsConfirmingRevokeAll(true)}
                      disabled={isRevokingAll}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Trash2 size={14} /> Terminate All Sessions
                    </button>
                  )}
                </div>

                {isLoadingSessions ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-2">
                    <Loader2 size={24} className="animate-spin text-[#ff8a5c]" />
                    <p className="text-xs text-gray-400">Loading active sessions...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <Laptop className="mx-auto mb-2 opacity-40 text-gray-400" size={36} />
                    <p className="text-sm font-medium text-gray-700">No active sessions</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      User is currently signed out across all devices.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 shrink-0">
                            {getDeviceIcon(session.deviceType)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                              <span>{session.browser || 'Web Client'}</span>
                              <span className="text-gray-400 font-normal">
                                on {session.os || 'Unknown OS'}
                              </span>
                              <span
                                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                                title="Active session"
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1 font-mono">
                                <Globe size={13} className="text-gray-400" />
                                {session.ipAddress || 'Unknown IP'}
                              </span>
                              {(session.city || session.country) && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={13} className="text-gray-400" />
                                  {[session.city, session.country].filter(Boolean).join(', ')}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-gray-400">
                                <Clock size={13} /> Active {new Date(session.updatedAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setSessionToRevoke(session)}
                          disabled={isRevokingSession}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Revoke session"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Recent Login History</h3>
                  <p className="text-xs text-gray-500">
                    Chronological audit trail of authentication attempts and security outcomes.
                  </p>
                </div>

                {isLoadingHistory ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-2">
                    <Loader2 size={24} className="animate-spin text-[#ff8a5c]" />
                    <p className="text-xs text-gray-400">Loading audit history...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <History className="mx-auto mb-2 opacity-40 text-gray-400" size={36} />
                    <p className="text-sm font-medium text-gray-700">No login attempts recorded</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      No sign-in records found for this account.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((record) => (
                      <div
                        key={record.id}
                        className="p-3.5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {record.status === 'SUCCESS' ? (
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle size={18} className="text-rose-500 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              <span>
                                {record.status === 'SUCCESS' ? 'Successful Sign-in' : 'Failed Attempt'}
                              </span>
                              {record.failureReason && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 font-mono border border-rose-100">
                                  {record.failureReason}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-500 text-[11px] mt-0.5">
                              {[record.browser, record.os].filter(Boolean).join(' on ') ||
                                'Standard Web Client'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-gray-700 font-medium">
                            {record.ipAddress || '—'}
                          </div>
                          <div className="text-gray-400 text-[11px] mt-0.5">
                            {new Date(record.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation modal for revoking a single session */}
      <ConfirmationModal
        isOpen={Boolean(sessionToRevoke)}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={() => {
          if (sessionToRevoke) {
            revokeSession(
              { userId: user.id, sessionId: sessionToRevoke.id },
              {
                onSuccess: () => setSessionToRevoke(null),
              },
            );
          }
        }}
        title="Revoke Device Session"
        description={`Are you sure you want to terminate the session on "${
          sessionToRevoke?.browser || 'Browser'
        }" (${sessionToRevoke?.ipAddress || 'IP'})? The user will be immediately logged out on that device.`}
        confirmText="Revoke Session"
        variant="danger"
        isLoading={isRevokingSession}
      />

      {/* Confirmation modal for revoking all sessions */}
      <ConfirmationModal
        isOpen={isConfirmingRevokeAll}
        onClose={() => setIsConfirmingRevokeAll(false)}
        onConfirm={() => {
          revokeAllSessions(user.id, {
            onSuccess: () => setIsConfirmingRevokeAll(false),
          });
        }}
        title="Terminate All Active Sessions"
        description={`Are you sure you want to revoke ALL active sessions for ${user.name}? They will be immediately disconnected across every device and browser.`}
        confirmText="Terminate All"
        variant="danger"
        isLoading={isRevokingAll}
      />
    </>
  );
};
