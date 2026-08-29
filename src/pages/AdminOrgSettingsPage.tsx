import { useParams } from 'react-router-dom';
import { AdminGuard } from '../components/admin/AdminGuard';
import { OrgSettingsPage } from './OrgSettingsPage';

export function AdminOrgSettingsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <AdminGuard>
      <OrgSettingsPage adminOrgId={id} />
    </AdminGuard>
  );
}
