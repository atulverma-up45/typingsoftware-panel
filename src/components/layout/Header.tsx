import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, PanelLeft, Building2, Menu, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, clearAuth } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  const handleNotificationClick = () => {
    toast.success('You have no new notifications.', {
      description: 'Check back later for updates.'
    });
  };

  const handleLogout = () => {
    clearAuth();
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const userName = user?.name || 'Alfiah';
  const userInitials = getInitials(userName);

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between px-6 bg-white border-b border-gray-100 relative z-40">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
        >
          <Menu size={24} className="text-gray-600" />
        </button>
        {/* Desktop sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors hidden lg:block"
        >
          <PanelLeft size={20} className="text-gray-400" />
        </button>

        <div className="relative hidden sm:flex items-center">
          <Search size={18} className="absolute left-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search licenses, modules..."
            className="h-[42px] w-[340px] rounded-[21px] border border-gray-200 bg-white pl-11 pr-4 text-[13px] outline-none focus:border-[#ff8a5c] focus:ring-1 focus:ring-[#ff8a5c] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button onClick={handleNotificationClick} className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff8a5c] border-2 border-white"></span>
        </button>

        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 focus:outline-none rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 py-1.5 px-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[#ff8a5c]" />
                <span className="text-[13px] font-medium text-gray-700">{userName}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 ml-1"><path d="m6 9 6 6 6-6" /></svg>
            </div>

            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#fff0eb] text-[#ff8a5c] font-semibold text-xs border border-[#ffe0d1]">
              {userInitials}
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-gray-100/80 mb-2">
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email || 'admin@typingexpert.com'}</p>
              </div>
              
              <div className="flex flex-col space-y-1">
                <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <UserIcon size={16} className="text-gray-400" />
                  My Profile
                </button>
                <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <Settings size={16} className="text-gray-400" />
                  Account Settings
                </button>
                
                <div className="h-px bg-gray-100/80 my-1 mx-2"></div>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-colors w-full text-left"
                >
                  <LogOut size={16} className="text-red-400" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
