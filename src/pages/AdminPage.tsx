import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CertificateList } from '../components/admin/CertificateList';
import { CertificateEdit } from '../components/admin/CertificateEdit';

type AdminView = { type: 'list' } | { type: 'edit'; id: string };

export function AdminPage() {
  const [view, setView] = useState<AdminView>({ type: 'list' });
  const navigate = useNavigate();

  const handlePrint = (id: string) => {
    navigate(`/print/${id}`);
  };

  if (view.type === 'edit') {
    return (
      <CertificateEdit
        certificateId={view.id}
        onBack={() => setView({ type: 'list' })}
        onPrint={handlePrint}
      />
    );
  }

  return (
    <CertificateList
      onView={(id) => setView({ type: 'edit', id })}
      onPrint={handlePrint}
    />
  );
}
