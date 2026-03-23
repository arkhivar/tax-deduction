import { useParams, useNavigate } from 'react-router-dom';
import { PrintView } from '../components/print/PrintView';

export function PrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return <div className="p-12 text-center text-gray-500">ID справки не указан</div>;
  }

  return <PrintView certificateId={id} onBack={() => navigate(-1)} />;
}
