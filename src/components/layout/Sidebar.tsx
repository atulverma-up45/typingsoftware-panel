import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Tooltip from '@/components/ui/Tooltip';
import {
  LayoutDashboard,
  Settings,
  GraduationCap,
  BrainCircuit,
  BookOpen,
  DollarSign,
  Briefcase,
  Clock,
  MessageSquare,
  BarChart2,
  Shield,
  Layers,
  FileText,
  Book,
  Keyboard,
} from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} strokeWidth={1.75} /> },
    { name: 'Institutions', path: '/institutions', icon: <GraduationCap size={20} strokeWidth={1.75} /> },
    { name: 'Licenses', path: '/licenses', icon: <Shield size={20} strokeWidth={1.75} /> },
    { name: 'Activations', path: '/activations', icon: <BrainCircuit size={20} strokeWidth={1.75} /> },
    { name: 'Modules', path: '/modules', icon: <Layers size={20} strokeWidth={1.75} /> },
    { name: 'Content', path: '/content', icon: <FileText size={20} strokeWidth={1.75} /> },
    { name: 'Subscriptions', path: '/subscriptions', icon: <DollarSign size={20} strokeWidth={1.75} /> },
    { name: 'Plans', path: '/plans', icon: <BarChart2 size={20} strokeWidth={1.75} /> },
    { name: 'Releases', path: '/releases', icon: <BookOpen size={20} strokeWidth={1.75} /> },
    { name: 'Uploads', path: '/uploads', icon: <Book size={20} strokeWidth={1.75} /> },
    { name: 'Branding', path: '/branding', icon: <Briefcase size={20} strokeWidth={1.75} /> },
    { name: 'Sync Logs', path: '/sync', icon: <Clock size={20} strokeWidth={1.75} /> },
    { name: 'Audit', path: '/audit', icon: <MessageSquare size={20} strokeWidth={1.75} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} strokeWidth={1.75} /> },
  ];

  return (
    <aside
      className={`${isSidebarOpen ? 'w-[240px]' : 'w-[80px]'
        } transition-all duration-300 ease-in-out flex flex-col bg-white border-r border-gray-100 flex-shrink-0 h-full`}
    >
      <div className={`flex h-[72px] items-center ${isSidebarOpen ? 'px-6' : 'justify-center'} shrink-0`}>
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff8a5c] text-white shrink-0">
            <Keyboard size={22} strokeWidth={2.5} />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-[15px] text-primary leading-tight tracking-tight">Typing Expert</span>
              <span className="text-[12px] text-gray-400 font-medium">Software Dashboard</span>
            </div>
          )}
        </div>
      </div>

      <div className={`pt-4 pb-2 ${isSidebarOpen ? 'px-6' : 'px-0 text-center'}`}>
        {isSidebarOpen ? (
          <p className="text-[11px] font-semibold text-gray-500 tracking-wider">NAVIGATION</p>
        ) : (
          <div className="w-4 h-[1px] bg-gray-200 mx-auto"></div>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto ${isSidebarOpen ? 'px-4' : 'px-2'} pb-4 space-y-1 custom-scrollbar`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Tooltip
              key={item.name}
              content={item.name}
              position="right"
              disabled={isSidebarOpen}
              className="block"
            >
              <Link
                to={item.path}
                className={`flex items-center gap-3 rounded-xl transition-colors ${isSidebarOpen ? 'px-4 py-2.5' : 'justify-center py-3'
                  } ${isActive
                    ? 'bg-[#fff0eb] text-[#ff8a5c] font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
              >
                <div className={`shrink-0 ${isActive ? 'text-[#ff8a5c]' : 'text-gray-400'}`}>
                  {item.icon}
                </div>
                {isSidebarOpen && <span className="text-[14px]">{item.name}</span>}
              </Link>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

