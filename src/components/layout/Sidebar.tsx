import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Keyboard } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import { usePermissions } from '@/lib/permissions';
import { getNavSectionsForRole } from '@/config/navigation';

interface SidebarProps {
  isSidebarOpen: boolean;
  onCloseMobile?: () => void;
}

interface NavSection {
  title?: string;
  items: {
    name: string;
    path: string;
    icon: React.ReactNode;
    badge?: string;
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, onCloseMobile }) => {
  const location = useLocation();
  const { role } = usePermissions();

  // Role-based sections built from the single navigation registry
  // (config/navigation.ts). It applies per-role labels/section headings and
  // omits routes the role cannot open — adding a page is a one-entry change
  // in the registry instead of editing three hardcoded arrays here.
  const navSections: NavSection[] = getNavSectionsForRole(role).map((section) => ({
    title: section.title,
    items: section.items.map((item) => ({
      name: item.name,
      path: item.path,
      icon: <item.icon size={19} strokeWidth={1.75} />,
    })),
  }));


  return (
    <aside
      className={`${
        isSidebarOpen ? 'w-[250px]' : 'w-[76px]'
      } transition-all duration-300 ease-in-out flex flex-col bg-white border-r border-gray-100 flex-shrink-0 h-full select-none`}
    >
      {/* Brand Header */}
      <div className={`flex h-[72px] items-center ${isSidebarOpen ? 'px-6' : 'justify-center'} shrink-0 border-b border-gray-50`}>
        <Link
          to="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-3 overflow-hidden whitespace-nowrap focus:outline-none"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-600 text-white shadow-2xs shrink-0">
            <Keyboard size={22} strokeWidth={2.5} />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-[15px] text-gray-900 leading-tight tracking-tight">Typing Expert</span>
              <span className="text-[11px] text-gray-400 font-medium">Enterprise Control Hub</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className={`flex-1 overflow-y-auto ${isSidebarOpen ? 'px-3.5' : 'px-2'} py-4 space-y-5 custom-scrollbar`}>
        {navSections.map((section, sIdx) => (
          <div key={section.title || sIdx} className="space-y-1">
            {section.title && (
              <div className={`${isSidebarOpen ? 'px-3' : 'text-center'} pb-1`}>
                {isSidebarOpen ? (
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider">
                    {section.title}
                  </p>
                ) : (
                  <div className="w-5 h-[1px] bg-gray-200 mx-auto my-1" />
                )}
              </div>
            )}

            {section.items.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/' && item.path !== '/dashboard' && location.pathname.startsWith(item.path));

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
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 rounded-xl transition-all ${
                      isSidebarOpen ? 'px-3.5 py-2.5' : 'justify-center py-2.5'
                    } ${
                      isActive
                        ? 'bg-primary-100 text-primary font-semibold shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div
                      className={`shrink-0 transition-transform ${
                        isActive ? 'text-primary scale-105' : 'text-gray-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    {isSidebarOpen && (
                      <span className="text-[13px] tracking-tight truncate flex-1">
                        {item.name}
                      </span>
                    )}
                    {isSidebarOpen && item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-100 text-primary font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </nav>

    </aside>
  );
};

export default Sidebar;
