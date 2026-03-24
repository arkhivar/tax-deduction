import { useState, useEffect } from 'react';
import { RefreshCw, Search, KeyRound, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Organization } from '../../types/certificate';
import { AdminLayout } from './AdminLayout';

interface OrganizationListProps {
  onBack: () => void;
}

export function OrganizationList({ onBack }: OrganizationListProps) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrgs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    setOrgs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const resetPin = async (orgId: string) => {
    setResettingId(orgId);
    const newPin = String(Math.floor(100000 + Math.random() * 900000));
    const { error } = await supabase
      .from('organizations')
      .update({ pin_code: newPin, updated_at: new Date().toISOString() })
      .eq('id', orgId);

    if (!error) {
      setOrgs((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, pin_code: newPin } : o))
      );
    }
    setResettingId(null);
  };

  const copyPin = (orgId: string, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedId(orgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = orgs.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.inn.includes(q) ||
      o.name.toLowerCase().includes(q) ||
      (o.full_name || '').toLowerCase().includes(q) ||
      (o.slug || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <AdminLayout title="Организации" onBack={onBack}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по ИНН, названию, slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={fetchOrgs}
            className="p-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            title="Обновить"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Всего организаций: {orgs.length}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              {searchQuery ? 'Ничего не найдено' : 'Организации отсутствуют'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/60">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ИНН</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">КПП</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">PIN</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-900 whitespace-nowrap">
                        {org.inn}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">
                        {org.kpp || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-900 max-w-xs truncate" title={org.full_name || org.name}>
                        {org.name || org.full_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {org.slug || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(org.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <code className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                            {org.pin_code}
                          </code>
                          <button
                            onClick={() => copyPin(org.id, org.pin_code)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Копировать PIN"
                          >
                            {copiedId === org.id ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => resetPin(org.id)}
                            disabled={resettingId === org.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
                              text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50
                              transition-colors"
                            title="Сбросить PIN"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{resettingId === org.id ? '...' : 'Новый PIN'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
