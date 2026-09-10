import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { usePermissions } from '@/lib/permissions';
import { MEDIA_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';
import { getMobileDockForRole } from '@/config/navigation';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Sidebar collapses into a flyout drawer below the lg breakpoint (1024px)
  const isMobile = !useMediaQuery(MEDIA_QUERY.LG);
  const location = useLocation();
  const { role } = usePermissions();

  // Sidebar state adjustments happen during render (React-endorsed pattern —
  // see "You Might Not Need an Effect") instead of setState-in-effect, which
  // triggers cascading renders:
  //   - crossing the lg breakpoint resets desktop-open / mobile-closed state
  //   - navigating on mobile auto-closes the drawer
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevIsMobile !== isMobile) {
    setPrevIsMobile(isMobile);
    setIsSidebarOpen(!isMobile);
  }
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    if (isMobile) setIsSidebarOpen(false);
  }

  // Lock body scroll when mobile drawer is open to prevent awkward background panning
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isSidebarOpen]);

  // Role-adapted mobile bottom dock — built from the navigation registry
  // (config/navigation.ts), which also defines per-role dock labels.
  const mobileNavItems = getMobileDockForRole(role).map((item) => ({
    name: item.name,
    path: item.path,
    icon: <item.icon size={20} strokeWidth={2} />,
  }));

  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden font-sans text-gray-800">
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Sidebar (Desktop Persistent or Mobile Flyout Drawer) */}
      <div
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 shadow-2xl z-50' : 'relative z-20'} 
          flex-shrink-0 transition-transform duration-300 ease-in-out
          ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        <Sidebar
          isSidebarOpen={isMobile ? true : isSidebarOpen}
          onCloseMobile={() => isMobile && setIsSidebarOpen(false)}
        />
      </div>

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-surface">
        <Header
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Scrollable Page Container with Mobile Bottom Nav Padding */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3.5 sm:p-5 lg:p-7 pb-24 lg:pb-8 custom-scrollbar">
          {/* Route-level error isolation: a crashing page never takes down
              the shell, and navigating away (resetKey) recovers it. */}
          <ErrorBoundary resetKey={location.pathname} variant="page">
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Mobile Quick Action Dock (Visible only on mobile/tablet viewports < 1024px) */}
        <nav
          aria-label="Mobile quick navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 px-2 py-1.5 z-30 flex items-center justify-around shadow-[0_-6px_25px_-4px_rgba(0,0,0,0.07)]"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {mobileNavItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-2.5 min-w-[54px] min-h-[46px] rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary-100 text-primary font-bold shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 active:scale-95'
                }`}
              >
                <div
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-110 text-primary' : 'text-gray-400'
                  }`}
                >
                  {item.icon}
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* More / Menu Drawer Trigger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open full menu drawer"
            className="flex flex-col items-center justify-center py-1 px-2.5 min-w-[54px] min-h-[46px] rounded-xl text-gray-500 hover:text-gray-900 active:scale-95 transition-all"
          >
            <div className="text-gray-400 p-0.5">
              <Menu size={20} strokeWidth={2} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
