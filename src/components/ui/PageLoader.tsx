import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Lightweight Suspense fallback for lazy-loaded route chunks.
 * Deliberately minimal: it must render instantly while the real page loads.
 */
export const PageLoader: React.FC = () => (
  <div
    className="flex min-h-[60vh] w-full items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <div className="flex flex-col items-center gap-3">
      <Loader2 size={28} className="animate-spin text-primary" />
      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
        Loading
      </span>
    </div>
  </div>
);

export default PageLoader;
