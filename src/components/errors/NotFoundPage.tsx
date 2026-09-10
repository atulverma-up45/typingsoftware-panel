import React from 'react';
import { Compass, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * 404 screen for unmatched URLs — keeps the app shell so navigation stays
 * available (rendered inside DashboardLayout by the router catch-all).
 */
export const NotFoundPage: React.FC = () => (
  <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl animate-in fade-in zoom-in-95 duration-200">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
        <Compass size={26} strokeWidth={2.2} />
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
        404 — Not Found
      </p>
      <h1 className="mt-1 text-lg font-bold text-gray-900">Page not found</h1>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-6 flex items-center justify-center">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          <LayoutDashboard size={14} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
