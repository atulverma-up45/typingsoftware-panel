import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  LayoutDashboard,
  Users,
  Shield,
  BrainCircuit,
  Layers,
  GraduationCap,
  Settings,
  DollarSign,
  Radio,
  FileText,
  BookOpen,
  Clock,
  ArrowRight,
} from 'lucide-react';

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  name: string;
  category: string;
  path: string;
  icon: React.ReactNode;
  keywords: string[];
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    name: 'Dashboard Overview',
    category: 'Overview',
    path: '/dashboard',
    icon: <LayoutDashboard size={16} />,
    keywords: ['metrics', 'telemetry', 'analytics', 'home', 'stats'],
  },
  {
    name: 'User Directory',
    category: 'Access & Staff',
    path: '/users',
    icon: <Users size={16} />,
    keywords: ['accounts', 'staff', 'admins', 'teachers', 'superadmin'],
  },
  {
    name: 'Auth & Device Tracking',
    category: 'Security & Access',
    path: '/auth-tracking',
    icon: <Radio size={16} />,
    keywords: ['sessions', 'security', 'threats', 'ip', 'login', 'devices'],
  },
  {
    name: 'Institutions Directory',
    category: 'Tenancy',
    path: '/institutions',
    icon: <GraduationCap size={16} />,
    keywords: ['schools', 'academies', 'tenants', 'colleges', 'organizations'],
  },
  {
    name: 'License Management',
    category: 'Licensing',
    path: '/licenses',
    icon: <Shield size={16} />,
    keywords: ['keys', 'seats', 'expiring', 'activation key', 'entitlements'],
  },
  {
    name: 'Activations & Hardware',
    category: 'Workstations',
    path: '/activations',
    icon: <BrainCircuit size={16} />,
    keywords: ['devices', 'terminals', 'computers', 'seats', 'lab'],
  },
  {
    name: 'Typing Modules',
    category: 'Curriculum',
    path: '/modules',
    icon: <Layers size={16} />,
    keywords: ['courses', 'lessons', 'typing', 'config', 'curriculum'],
  },
  {
    name: 'Lesson Content & Passages',
    category: 'Curriculum',
    path: '/content',
    icon: <FileText size={16} />,
    keywords: ['passages', 'texts', 'exams', 'tests', 'words'],
  },
  {
    name: 'Commercial Subscriptions',
    category: 'Commercial',
    path: '/subscriptions',
    icon: <DollarSign size={16} />,
    keywords: ['billing', 'invoices', 'renewals', 'status', 'commercial'],
  },
  {
    name: 'Pricing & Plans',
    category: 'Commercial',
    path: '/plans',
    icon: <DollarSign size={16} />,
    keywords: ['tiers', 'pricing', 'features', 'seats', 'limits'],
  },
  {
    name: 'Software Releases',
    category: 'Software',
    path: '/releases',
    icon: <BookOpen size={16} />,
    keywords: ['downloads', 'installer', 'client', 'updates', 'versions'],
  },
  {
    name: 'Sync Telemetry Logs',
    category: 'Operations',
    path: '/sync',
    icon: <Clock size={16} />,
    keywords: ['logs', 'telemetry', 'diagnostics', 'offline', 'workstation'],
  },
  {
    name: 'Audit Trail & Forensics',
    category: 'Operations',
    path: '/audit',
    icon: <Clock size={16} />,
    keywords: ['audit', 'logs', 'compliance', 'security', 'activity'],
  },
  {
    name: 'System Settings',
    category: 'Configuration',
    path: '/settings',
    icon: <Settings size={16} />,
    keywords: ['preferences', 'api', 'profile', 'theme', 'config'],
  },
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim()
    ? SEARCH_ITEMS.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
    : SEARCH_ITEMS.slice(0, 8);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].path);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col mt-12 sm:mt-0 max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-100">
          <Search size={18} className="text-primary shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInput}
            placeholder="Search pages, modules, settings, or licenses..."
            className="w-full text-sm font-medium text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X size={15} />
            </button>
          ) : (
            <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold border border-gray-200">
              ESC
            </span>
          )}
          <button
            onClick={onClose}
            className="sm:hidden p-1.5 ml-2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 max-h-[360px] custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No matching pages or features found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-primary-100 text-primary'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold">{item.name}</p>
                      <p className="text-[11px] text-gray-400">{item.category}</p>
                    </div>
                  </div>

                  <ArrowRight
                    size={14}
                    className={`transition-transform ${
                      isSelected ? 'translate-x-0 text-primary' : '-translate-x-1 opacity-0'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer Quick Shortcuts */}
        <div className="hidden sm:flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 text-[11px] text-gray-400">
          <div className="flex items-center gap-2">
            <span>Navigate:</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">↓</kbd>
            <span>Select:</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">↵</kbd>
          </div>
          <div>Typing Expert Admin Hub</div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;

