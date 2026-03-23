import { Navigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';

export function OrgGuard({ children }: { children: React.ReactNode }) {
  const { org, loading } = useOrg();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!org) {
    return <Navigate to="/org/login" replace />;
  }

  return <>{children}</>;
}
