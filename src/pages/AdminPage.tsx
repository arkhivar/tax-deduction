import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CertificateList } from '../components/admin/CertificateList';
import { CertificateEdit } from '../components/admin/CertificateEdit';
import { OrganizationList } from '../components/admin/OrganizationList';

type AdminView =
  | { type: 'certificates' }
  | { type: 'edit'; id: string }
  | { type: 'organizations' };

export function AdminPage() {
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

  if (view.type === 'organizations') {
    return (
      <OrganizationList onBack={() => setView({ type: 'certificates' })} />
    );
  }

  return (
    <CertificateList
      onView={(id) => setView({ type: 'edit', id })}
      onPrint={handlePrint}
      onShowOrgs={() => setView({ type: 'organizations' })}
    />
  );
}
