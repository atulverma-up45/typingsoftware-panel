import React from 'react';
import { ShieldAlert, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface ForbiddenPageProps {
  /** The role that was denied, shown only to explain the restriction. */
  role?: string | null;
}

/**
 * Honest 403 screen rendered in place by RoleRoute — no silent redirects.
 * Mirrors the API's 403 semantics: the session is valid, the role is not.
 */
export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({ role }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600">
          <ShieldAlert size={26} strokeWidth={2.2} />
        </div>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          403 — Forbidden
        </p>
        <h1 className="mt-1 text-lg font-bold text-gray-900">Access Restricted</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
          {role
            ? `Your role (${role}) is not authorized to open this module. If you believe this is a mistake, contact a platform administrator.`
            : 'Your session role could not be verified, so access is denied. Try signing in again.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            <LayoutDashboard size={14} />
            Go to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200/80 hover:text-gray-800"
          >
            <ArrowLeft size={14} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
