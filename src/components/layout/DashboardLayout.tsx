import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import {
  LayoutDashboard,
  Users,
  Shield,
  BrainCircuit,
  Menu,
} from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Responsive mobile detector
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Mobile Bottom Quick Navigation Destinations
  const mobileNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={19} /> },
    { name: 'Users', path: '/users', icon: <Users size={19} /> },
    { name: 'Licenses', path: '/licenses', icon: <Shield size={19} /> },
    { name: 'Devices', path: '/activations', icon: <BrainCircuit size={19} /> },
  ];

  return (
    <div className="flex h-screen w-full bg-[#fcfcfc] overflow-hidden font-sans text-gray-800">
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-[#fcfcfc]">
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
          className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-3 py-1.5 z-30 flex items-center justify-around shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}
        >
          {mobileNavItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#ff8a5c] font-bold'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
              </Link>
            );
          })}

          {/* More / Menu Drawer Trigger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open full menu"
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-gray-400 hover:text-gray-700 transition-colors"
          >
            <div className="p-1">
              <Menu size={19} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
