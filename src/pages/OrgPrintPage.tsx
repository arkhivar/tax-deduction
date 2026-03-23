import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, QrCode, Stamp, PenLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Certificate } from '../types/certificate';
import { PrintPage } from '../components/print/PrintPage';
import { useOrg } from '../contexts/OrgContext';

export function OrgPrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { org } = useOrg();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showStamp, setShowStamp] = useState(true);
  const [showFacsimile, setShowFacsimile] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase
        .from('education_certificates')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setCert(data);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-gray-500 text-sm">Загрузка...</div>;
  if (!cert) return <div className="p-12 text-center text-gray-500 text-sm">Справка не найдена</div>;

  const overlays: OverlayConfig = {
    qrUrl: showQr ? org?.qr_code_url : null,
    stampUrl: showStamp ? org?.stamp_url : null,
    facsimileUrl: showFacsimile ? org?.facsimile_url : null,
  };

  return (
    <div>
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[900px] mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/org/dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          <div className="flex items-center gap-3">
            {org?.qr_code_url && (
              <ToggleButton icon={QrCode} label="QR" active={showQr} onClick={() => setShowQr(!showQr)} />
            )}
            {org?.stamp_url && (
              <ToggleButton icon={Stamp} label="Печать" active={showStamp} onClick={() => setShowStamp(!showStamp)} />
            )}
            {org?.facsimile_url && (
              <ToggleButton icon={PenLine} label="Подпись" active={showFacsimile} onClick={() => setShowFacsimile(!showFacsimile)} />
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800
                text-white text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              Печать
            </button>
          </div>
        </div>
      </div>
      <div className="print:m-0 print:p-0 max-w-[900px] mx-auto p-4">
        <PrintPageWithOverlays cert={cert} overlays={overlays} />
      </div>
    </div>
  );
}

interface OverlayConfig {
  qrUrl: string | null | undefined;
  stampUrl: string | null | undefined;
  facsimileUrl: string | null | undefined;
}

function PrintPageWithOverlays({ cert, overlays }: { cert: Certificate; overlays: OverlayConfig }) {
  return (
    <div className="relative">
      <PrintPage cert={cert} />
      {overlays.qrUrl && (
        <img
          src={overlays.qrUrl}
          alt="QR"
          className="absolute"
          style={{ right: '15mm', top: '210mm', width: '24mm', height: '24mm', objectFit: 'contain' }}
        />
      )}
      {overlays.stampUrl && (
        <img
          src={overlays.stampUrl}
          alt="Stamp"
          className="absolute opacity-80"
          style={{
            right: '50mm',
            bottom: '55mm',
            width: '30mm',
            height: '30mm',
            objectFit: 'contain',
            transform: 'rotate(-5deg)',
          }}
        />
      )}
      {overlays.facsimileUrl && (
        <img
          src={overlays.facsimileUrl}
          alt="Facsimile"
          className="absolute"
          style={{
            left: '30mm',
            bottom: '52mm',
            width: '30mm',
            height: '12mm',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  );
}

function ToggleButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
        active
          ? 'bg-gray-100 text-gray-900'
          : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
