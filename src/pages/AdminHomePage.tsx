import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { FileText, Clock, Sparkles, ArrowRight, Building2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Organization } from '../types/certificate';
import { AdminLayout } from '../components/admin/AdminLayout';

export function AdminHomePage() {
  usePageTitle('Административная панель');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: orgRows }, { data: statRows }] = await Promise.all([
        api.organizations.list(),
        api.certificates.stats(),
      ]);
      setOrgs(orgRows || []);
      let total = 0;
      let pending = 0;
      for (const row of statRows || []) {
        if (!row.org_id) continue;
        total += parseInt(row.total);
        pending += parseInt(row.pending);
      }
      setStats({ total, pending });
      setLoading(false);
    })();
  }, []);

  const premiumRequests = orgs.filter((o) => o.premium_requested_at).length;

  const chips = [
    { icon: FileText, iconColor: 'text-blue-500', label: 'Всего заявок', value: stats.total, valueColor: 'text-gray-900' },
    { icon: Clock, iconColor: 'text-amber-500', label: 'Ожидают', value: stats.pending, valueColor: 'text-amber-600' },
    { icon: Sparkles, iconColor: 'text-teal-500', label: 'Premium-заявки', value: premiumRequests, valueColor: 'text-teal-600' },
  ];

  const sections = [
    { to: '/admin/forms', icon: FileText, title: 'Формы', text: 'Все справки от всех организаций' },
    { to: '/admin/orgs', icon: Building2, title: 'Организации', text: 'Организации, slug, PIN-коды, заметки' },
  ];

  return (
    <AdminLayout title="Обзор">
      <div className="space-y-5">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Загрузка...</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              {chips.map((c) => (
                <div key={c.label} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <c.icon className={`w-4 h-4 ${c.iconColor}`} />
                  <div className="text-sm">
                    <span className="text-gray-500">{c.label}:</span>{' '}
                    <span className={`font-semibold ${c.valueColor}`}>{c.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {sections.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm
                    hover:border-gray-300 hover:shadow transition-all group"
                >
                  <s.icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{s.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.text}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
