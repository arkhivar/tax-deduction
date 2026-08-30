import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { CertificateList } from '../components/admin/CertificateList';
import { CertificateEdit } from '../components/admin/CertificateEdit';

type AdminView =
  | { type: 'certificates' }
  | { type: 'edit'; id: string };

export function AdminPage() {
  usePageTitle('Формы — административная панель');
  const [view, setView] = useState<AdminView>({ type: 'certificates' });
  const navigate = useNavigate();

  const handlePrint = (id: string) => {
    navigate(`/print/${id}`);
  };

  if (view.type === 'edit') {
    return (
      <CertificateEdit
        certificateId={view.id}
        onBack={() => setView({ type: 'certificates' })}
        onPrint={handlePrint}
      />
    );
  }

  return (
    <CertificateList
      onView={(id) => setView({ type: 'edit', id })}
      onPrint={handlePrint}
      onShowOrgs={() => navigate('/admin/orgs')}
    />
  );
}
