import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DOC_TYPE_OPTIONS } from './formHelpers';

interface DocTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

export function DocTypeSelect({ value, onChange, hasError = false }: DocTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = DOC_TYPE_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 border rounded ${
          hasError ? 'border-red-400 bg-red-50/30' : 'border-black bg-white hover:bg-gray-50'
        }`}
      >
        <span>{selected ? selected.label : 'Выберите'}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-0.5 z-20 bg-white border border-gray-300 rounded shadow-lg min-w-[240px]">
            {DOC_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full text-left px-3 py-1.5 text-[10px] hover:bg-blue-50 ${
                  opt.value === value ? 'bg-blue-100 font-medium' : ''
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
