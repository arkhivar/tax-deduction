import { useState, useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Certificate } from '../../types/certificate';
import { PrintPage } from './PrintPage';

interface PrintViewProps {
  certificateId: string;
  onBack: () => void;
}

export function PrintView({ certificateId, onBack }: PrintViewProps) {
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('education_certificates')
        .select('*')
        .eq('id', certificateId)
        .maybeSingle();
      setCert(data);
      setLoading(false);
    };
    load();
  }, [certificateId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 text-sm">Загрузка...</div>;
  }

  if (!cert) {
    return <div className="p-12 text-center text-gray-500 text-sm">Справка не найдена</div>;
  }

  return (
    <div>
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[900px] mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700
              text-white text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Печать
          </button>
        </div>
      </div>

      <div className="print:m-0 print:p-0 max-w-[900px] mx-auto p-4">
        <PrintPage cert={cert} />
      </div>
    </div>
  );
}
