import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Home } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
}

export function AdminLayout({ children, title, onBack }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900 text-sm">КНД 1151158</span>
            </div>
          )}
          <div className="h-5 w-px bg-gray-200" />
          <h1 className="text-sm font-medium text-gray-700 flex-1">{title}</h1>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-1.5 rounded-md transition-colors"
            title="Вернуться к форме"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Вернуться к форме</span>
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
