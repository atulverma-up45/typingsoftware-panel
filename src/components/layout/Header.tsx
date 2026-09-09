import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, PanelLeft, Building2, Menu, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import SearchModal from '@/components/ui/SearchModal';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, clearAuth } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNotificationClick = () => {
    toast.success('You have no new notifications.', {
      description: 'All system services and workstations are operating normally.',
    });
  };

  const handleLogout = () => {
    clearAuth();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const userName = user?.name || 'Administrator';
  const userInitials = getInitials(userName);

  return (
    <>
      <header className="flex h-[72px] shrink-0 items-center justify-between px-4 sm:px-6 bg-white border-b border-gray-100 relative z-30">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle mobile menu"
            className="p-2 -ml-1.5 rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors lg:hidden"
          >
            <Menu size={22} />
          </button>

          {/* Desktop sidebar toggle button */}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle sidebar collapse"
            className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors hidden lg:block"
          >
            <PanelLeft size={20} className="text-gray-400 hover:text-gray-700" />
          </button>

          {/* Desktop Quick Search Launcher */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center justify-between h-[42px] w-64 md:w-80 rounded-2xl border border-gray-200/90 bg-gray-50/50 hover:bg-white pl-3.5 pr-2.5 text-xs text-gray-400 hover:border-primary/50 transition-all shadow-2xs group cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <Search size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
              <span className="text-gray-400 font-medium">Search anything...</span>
            </div>
            <kbd className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-[10px] font-mono font-semibold text-gray-500 shadow-2xs">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right Section: Mobile Search, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Search Button (visible only on small viewports) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search"
            className="sm:hidden p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Search size={20} />
          </button>

          {/* Notifications Button */}
          <button
            onClick={handleNotificationClick}
            aria-label="Notifications"
            className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-white"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 sm:gap-2.5 focus:outline-none rounded-full transition-all hover:opacity-90 active:scale-95"
            >
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50/80 py-1.5 px-3 max-w-[200px]">
                <Building2 size={15} className="text-primary shrink-0" />
                <span className="text-xs font-semibold text-gray-700 truncate">{userName}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400 shrink-0 ml-0.5"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>

              <div className="flex h-9 w-9 sm:h-[38px] sm:w-[38px] items-center justify-center rounded-full bg-primary-100 text-primary font-bold text-xs border border-primary-200 shadow-2xs">
                {userInitials}
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-white p-2 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 z-50">
                <div className="px-3.5 py-2.5 border-b border-gray-100 mb-1.5">
                  <p className="text-xs font-bold text-gray-900 truncate">{userName}</p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    {user?.email || 'admin@typingexpert.com'}
                  </p>
                  <span className="inline-block mt-1.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-orange-50 text-primary border border-orange-200">
                    {user?.role || 'ADMIN'}
                  </span>
                </div>

                <div className="flex flex-col space-y-0.5">
                  <Link
                    to="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <UserIcon size={15} className="text-gray-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <Settings size={15} className="text-gray-400" />
                    <span>System Settings</span>
                  </Link>

                  <div className="h-px bg-gray-100 my-1 mx-2" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 font-medium rounded-xl hover:bg-rose-50 transition-colors w-full text-left"
                  >
                    <LogOut size={15} className="text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;
