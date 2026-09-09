import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import {
  LayoutDashboard,
  Users,
  Shield,
  BrainCircuit,
  Layers,
  FileText,
  GraduationCap,
  Menu,
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import { MEDIA_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Sidebar collapses into a flyout drawer below the lg breakpoint (1024px)
  const isMobile = !useMediaQuery(MEDIA_QUERY.LG);
  const location = useLocation();
  const { isSuperAdmin, isAdmin, isSupport } = usePermissions();

  // Keep sidebar visibility in sync when crossing the breakpoint
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  // Auto-close sidebar drawer when navigating to another route on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

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

  // Role-Adapted Mobile Bottom Quick Navigation Destinations
  // For Librarian/ADMIN: strictly focused on high-frequency daily classroom & computer lab tasks:
  // 1. Dashboard (real-time activity)
  // 2. Students (/users: lookups, enrollment, password resets)
  // 3. Workstations (/activations: seat unlocking, deallocations, live PCs)
  // 4. Passages (/content: daily test prompts & practice text)
  // 5. More (Slide-out drawer for everything else)
  const mobileNavItems = isAdmin
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} strokeWidth={2} /> },
        { name: 'Students', path: '/users', icon: <Users size={20} strokeWidth={2} /> },
        { name: 'Workstations', path: '/activations', icon: <BrainCircuit size={20} strokeWidth={2} /> },
        { name: 'Passages', path: '/content', icon: <FileText size={20} strokeWidth={2} /> },
      ]
    : isSupport
    ? [
        // Support role: read-only tenant & license inspection
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} strokeWidth={2} /> },
        { name: 'Tenants', path: '/institutions', icon: <GraduationCap size={20} strokeWidth={2} /> },
        { name: 'Licenses', path: '/licenses', icon: <Shield size={20} strokeWidth={2} /> },
        { name: 'Devices', path: '/activations', icon: <BrainCircuit size={20} strokeWidth={2} /> },
      ]
    : [
        // Super Admin: executive oversight
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} strokeWidth={2} /> },
        { name: 'Users', path: '/users', icon: <Users size={20} strokeWidth={2} /> },
        { name: 'Tenants', path: '/institutions', icon: <GraduationCap size={20} strokeWidth={2} /> },
        { name: 'Workstations', path: '/activations', icon: <BrainCircuit size={20} strokeWidth={2} /> },
      ];

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
          <Outlet />
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
