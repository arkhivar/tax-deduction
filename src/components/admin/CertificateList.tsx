import { useState, useEffect } from 'react';
import { RefreshCw, Eye, Printer, Search, Filter, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Certificate } from '../../types/certificate';
import { AdminLayout } from './AdminLayout';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Завершена', color: 'bg-green-100 text-green-800' },
  printed: { label: 'Напечатана', color: 'bg-blue-100 text-blue-800' },
};

interface CertificateListProps {
  onView: (id: string) => void;
  onPrint: (id: string) => void;
  onShowOrgs?: () => void;
}

export function CertificateList({ onView, onPrint, onShowOrgs }: CertificateListProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCertificates = async () => {
    setLoading(true);
    let query = supabase
      .from('education_certificates')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    setCertificates(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCertificates();
  }, [statusFilter]);

  const filtered = certificates.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.taxpayer_last_name.toLowerCase().includes(q) ||
      c.taxpayer_first_name.toLowerCase().includes(q) ||
      c.org_name.toLowerCase().includes(q) ||
      c.org_inn.includes(q)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <AdminLayout title="Список справок">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по ФИО, организации, ИНН..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                  appearance-none cursor-pointer"
              >
                <option value="all">Все статусы</option>
                <option value="draft">Черновики</option>
                <option value="completed">Завершённые</option>
                <option value="printed">Напечатанные</option>
              </select>
            </div>
            {onShowOrgs && (
              <button
                onClick={onShowOrgs}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm text-gray-700 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Организации</span>
              </button>
            )}
            <button
              onClick={fetchCertificates}
              className="p-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              title="Обновить"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              {searchQuery ? 'Ничего не найдено' : 'Справки отсутствуют'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/60">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Налогоплательщик</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Организация</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Сумма</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((cert) => {
                    const status = STATUS_LABELS[cert.status] || STATUS_LABELS.draft;
                    return (
                      <tr key={cert.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {formatDate(cert.created_at)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {cert.taxpayer_last_name} {cert.taxpayer_first_name}
                          {cert.taxpayer_patronymic ? ` ${cert.taxpayer_patronymic}` : ''}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                          {cert.org_name}
                        </td>
                        <td className="px-4 py-3 text-gray-900 text-right whitespace-nowrap font-mono">
                          {formatAmount(cert.expense_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onView(cert.id)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                              title="Просмотреть"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onPrint(cert.id)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                              title="Печать"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
