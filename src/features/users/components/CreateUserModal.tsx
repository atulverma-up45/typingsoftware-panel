import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  Building,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { useCreateUser, useInstitutions, type UserRole } from '../api/userApi';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose }) => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [institutionId, setInstitutionId] = useState(
    isSuperAdmin ? '' : currentUser?.institutionId || '',
  );
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

  // Fetch institutions list for Super Admin dropdown
  const { data: institutions = [], isLoading: isLoadingInstitutions } = useInstitutions(
    isSuperAdmin && isOpen,
  );

  const { mutate: createUser, isPending } = useCreateUser();

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    toast.success('Strong password generated');
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    createUser(
      {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        institutionId: isSuperAdmin
          ? institutionId.trim() || null
          : currentUser?.institutionId || null,
      },
      {
        onSuccess: () => {
          onClose();
          setName('');
          setEmail('');
          setPassword('');
          setRole('ADMIN');
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-[#ff8a5c] border border-orange-100">
              <UserIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Provision New User</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isSuperAdmin
                  ? 'Provision administrative or staff accounts across institutions.'
                  : `Provision staff under your assigned institution.`}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@institution.edu"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 transition-all"
              />
            </div>
          </div>

          {/* Initial Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Initial Password
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-20 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 font-mono transition-all"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {password && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                    title="Copy Password"
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
            <p className="text-[11px] text-gray-400 mt-1">
              User will be marked email-verified upon creation and can immediately log in.
            </p>
          </div>

          {/* Role & Institution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                System Role
              </label>
              <div className="relative">
                <Shield
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={18}
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-8 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 appearance-none cursor-pointer"
                >
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Administrator</option>}
                  <option value="ADMIN">Administrator</option>
                  <option value="SUPPORT">Support Specialist</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Institution Assignment
              </label>
              {isSuperAdmin ? (
                <div className="relative">
                  <Building
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={18}
                  />
                  <select
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    disabled={role === 'SUPER_ADMIN'}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-8 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">None (Global Platform)</option>
                    {isLoadingInstitutions ? (
                      <option disabled>Loading institutions...</option>
                    ) : (
                      institutions.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} ({inst.slug})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-700">
                  <Building size={16} className="text-gray-400 shrink-0" />
                  <span className="truncate">{currentUser?.institutionId || 'Current Institution'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-[#ff8a5c] hover:bg-[#f77947] rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Provision User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
