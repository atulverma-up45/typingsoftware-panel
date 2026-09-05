import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Lock,
  Send,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  AlertTriangle,
  MailCheck,
} from 'lucide-react';
import {
  type User,
  useResetUserPassword,
  useSendResetPasswordEmail,
} from '../api/userApi';
import { toast } from 'sonner';

interface ResetPasswordModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'email'>('direct');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const { mutate: resetPassword, isPending: isResetting } = useResetUserPassword();
  const { mutate: sendResetEmail, isPending: isSendingEmail } = useSendResetPasswordEmail();

  if (!isOpen || !user) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    toast.success('Strong password generated');
  };

  const handleCopy = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    resetPassword(
      { id: user.id, password: newPassword },
      {
        onSuccess: () => {
          onClose();
          setNewPassword('');
        },
      },
    );
  };

  const handleSendEmail = () => {
    sendResetEmail(user.id, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Reset Credentials</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Account: <span className="font-semibold text-gray-800">{user.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100 px-6 bg-gray-50/30">
          <button
            onClick={() => setActiveTab('direct')}
            className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'direct'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Lock size={14} /> Direct Reset
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'email'
                ? 'border-[#ff8a5c] text-[#ff8a5c]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Send size={14} /> Send Email Link
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'direct' ? (
            <form onSubmit={handleDirectReset} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Set New Password
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs text-[#ff8a5c] hover:text-[#f77947] font-medium flex items-center gap-1 hover:underline"
                >
                  <Sparkles size={13} /> Auto Generate
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter or generate new password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-20 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 font-mono transition-all"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {newPassword && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                      title="Copy password"
                    >
                      {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-800 text-xs leading-relaxed">
                <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Security Note:</strong> Setting a new password directly will immediately revoke all active device sessions for this user.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isResetting}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !newPassword}
                  className="px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isResetting && <Loader2 size={16} className="animate-spin" />}
                  Save New Password
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                <MailCheck size={22} className="shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Send Reset Email</h4>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    A secure, single-use password reset link will be dispatched to{' '}
                    <span className="font-semibold text-blue-900">{user.email}</span>. The link will expire in 60 minutes.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSendingEmail}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSendingEmail && <Loader2 size={16} className="animate-spin" />}
                  Dispatch Reset Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
