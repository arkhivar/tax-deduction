import { Link, useLocation } from 'react-router-dom';
import { FileText, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { useOrg } from '../../contexts/OrgContext';

interface OrgLayoutProps {
  children: React.ReactNode;
}

export function OrgLayout({ children }: OrgLayoutProps) {
  const { org, logout } = useOrg();
  const location = useLocation();

  const navItems = [
    { to: '/org/dashboard', label: 'Справки', icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="group flex items-center gap-2 text-gray-900"
              title="Вернуться к форме"
            >
              <FileText className="w-5 h-5 text-gray-700" />
              <span className="font-semibold text-sm hidden sm:block group-hover:underline underline-offset-4">Форма КНД 1151158</span>
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/org/settings"
              className="group flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
              title="Настройки"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:block max-w-[200px] truncate group-hover:underline underline-offset-4">{org?.name}</span>
            </Link>
            <button
              onClick={() => {
                logout();
                window.location.href = '/org/login';
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-600
                hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
