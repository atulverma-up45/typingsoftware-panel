import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { type UserRole, hasAnyRole } from "@/lib/permissions";
import { ForbiddenPage } from "@/components/errors/ForbiddenPage";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50/70 via-surface to-background px-4 overflow-hidden select-none">
        {/* Soft Multi-Layered Ambient Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-gradient-to-tr from-orange-400/15 via-rose-300/10 to-amber-200/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-200/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center max-w-md text-center z-10">
          {/* Logo Hero Section with Multi-Ring Effects */}
          <div className="relative mb-8 flex items-center justify-center">
            {/* Outer Slow-Spinning Dashed Tech Ring */}
            <div className="absolute w-44 h-44 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-full border border-dashed border-primary/25 animate-spin-slow pointer-events-none" />

            {/* Middle Pulsing Halo Ring */}
            <div className="absolute w-36 h-36 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full border border-primary/30 animate-pulse-ring pointer-events-none" />

            {/* Soft Ambient Inner Glow */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-primary/25 via-orange-300/15 to-transparent blur-2xl animate-pulse pointer-events-none" />

            {/* High-Resolution Logo with Floating Breathe Effect */}
            <img
              src="/logo.png"
              alt="TypingExpert Logo"
              className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 object-contain animate-logo-breathe"
            />
          </div>

          {/* Brand Heading - Large & Crisp */}
          <div className="flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
              Typing
            </span>
            <span className="text-gray-900">Expert</span>
          </div>

          {/* Brand Tagline with Orange Divider Accents */}
          <div className="flex items-center gap-2.5 mt-2 text-xs sm:text-sm font-semibold tracking-wider text-gray-400 uppercase">
            <span className="w-6 h-[2px] bg-primary/50 rounded-full" />
            <span>Type Better. Think Faster.</span>
            <span className="w-6 h-[2px] bg-primary/50 rounded-full" />
          </div>

          {/* High-Gloss Shimmering Progress Bar */}
          <div className="w-60 sm:w-72 md:w-80 h-2 bg-orange-100/60 rounded-full overflow-hidden mt-8 relative shadow-inner border border-orange-100/70">
            <div className="absolute inset-y-0 w-2/5 bg-gradient-to-r from-orange-400 via-primary to-primary-600 rounded-full animate-progress-shimmer shadow-[0_0_14px_rgba(255,138,92,0.7)]" />
          </div>

          {/* Live Status Pill with Glowing Ping Indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-orange-100/80 shadow-xs mt-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[12px] font-semibold text-gray-600 tracking-tight">
              Securing workspace session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const user = useAuthStore((state) => state.user);
  // Fail-closed: an unknown or missing role is never granted access.
  const userRole = user?.role as UserRole | undefined;
  const isAllowed = Boolean(userRole) && hasAnyRole(userRole, allowedRoles);

  // Honest in-place 403 (no silent redirect) — the app shell stays, the user
  // gets an explanation and a way out. Mirrors the API's 403 semantics.
  if (!isAllowed) {
    return <ForbiddenPage role={userRole} />;
  }

  return <Outlet />;
}

