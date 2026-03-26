import { useRef, useCallback, useState } from 'react';
import { toCyrillicText, toCyrillicName } from '../../lib/cyrillic';

const CELL_SIZE = 16;

interface CellInputProps {
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
  filter?: 'digits' | 'text' | 'flag' | 'cyrillic' | 'cyrillic_name' | 'org_text';
  disabled?: boolean;
  hasError?: boolean;
  cellSize?: number;
}

export function CellInput({
  value,
  maxLength,
  onChange,
  filter,
  disabled = false,
  hasError = false,
  cellSize = CELL_SIZE,
}: CellInputProps) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const cursorIndex = Math.min(value.length, maxLength - 1);

  const chars: string[] = [];
  for (let i = 0; i < maxLength; i++) {
    chars.push(value[i] || '');
  }

  const handleClick = () => {
    if (!disabled) hiddenRef.current?.focus();
  };

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value;
      if (filter === 'digits') v = v.replace(/\D/g, '');
      else if (filter === 'flag') {
        v = v.replace(/[^01]/g, '');
        if (v.length > 1) v = v.slice(-1);
      }
      else if (filter === 'cyrillic') v = toCyrillicText(v);
      else if (filter === 'cyrillic_name') v = toCyrillicName(v);
      else if (filter === 'org_text') v = v.replace(/[^\u0400-\u04FFa-zA-Z\s.,\-"'«»()/№;:!+&_@#0-9]/g, '');
      v = v.slice(0, maxLength).toUpperCase();
      onChange(v);
    },
    [filter, maxLength, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filter === 'flag' && e.key !== '0' && e.key !== '1' && e.key !== 'Backspace' && e.key !== 'Tab') {
      e.preventDefault();
    }
  };

  return (
    <span className="inline-flex cursor-text" onClick={handleClick}>
      <input
        ref={hiddenRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={maxLength}
        disabled={disabled}
        className="sr-only"
        tabIndex={disabled ? -1 : 0}
      />
      {chars.map((ch, i) => {
        const isCursorCell = focused && !disabled && i === cursorIndex;
        return (
          <span
            key={i}
            className={`relative border text-center font-mono leading-none select-none ${
              disabled
                ? 'border-gray-300 bg-gray-50 text-gray-400'
                : isCursorCell
                  ? 'border-blue-500 bg-blue-50/40'
                  : hasError
                    ? 'border-red-400 bg-red-50/30'
                    : 'border-black'
            }`}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              fontSize: `${cellSize - 4}px`,
              lineHeight: `${cellSize}px`,
              marginLeft: i > 0 ? '-1px' : '0',
            }}
          >
            {ch}
            {isCursorCell && (
              <span
                className="absolute bottom-[1px] left-1/2 -translate-x-1/2 bg-blue-600 animate-blink"
                style={{
                  width: `${Math.max(cellSize - 6, 4)}px`,
                  height: '1.5px',
                }}
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

interface LabeledCellInputProps extends CellInputProps {
  label: string;
  className?: string;
}

export function LabeledCellInput({ label, className = '', ...rest }: LabeledCellInputProps) {
  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className="text-[10px] whitespace-nowrap">{label}</span>
      <CellInput {...rest} />
    </span>
  );
}

interface DateCellInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  cellSize?: number;
}

export function DateCellInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
  cellSize = CELL_SIZE,
}: DateCellInputProps) {
  const parts = parseDateValue(value);

  const handleDayChange = (d: string) => {
    onChange(buildDate(d, parts.month, parts.year));
  };
  const handleMonthChange = (m: string) => {
    onChange(buildDate(parts.day, m, parts.year));
  };
  const handleYearChange = (y: string) => {
    onChange(buildDate(parts.day, parts.month, y));
  };

  return (
    <span className="inline-flex items-baseline gap-0">
      <CellInput value={parts.day} maxLength={2} onChange={handleDayChange} filter="digits" disabled={disabled} hasError={hasError} cellSize={cellSize} />
      <span className="mx-0.5 text-[10px]">.</span>
      <CellInput value={parts.month} maxLength={2} onChange={handleMonthChange} filter="digits" disabled={disabled} hasError={hasError} cellSize={cellSize} />
      <span className="mx-0.5 text-[10px]">.</span>
      <CellInput value={parts.year} maxLength={4} onChange={handleYearChange} filter="digits" disabled={disabled} hasError={hasError} cellSize={cellSize} />
    </span>
  );
}

interface AmountCellInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  hasError?: boolean;
  cellSize?: number;
}

export function AmountCellInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
  cellSize = CELL_SIZE,
}: AmountCellInputProps) {
  const parts = formatAmountParts(value);

  const handleIntChange = (v: string) => {
    const num = parseFloat(`${v || '0'}.${parts.decimal}`);
    onChange(isNaN(num) ? 0 : num);
  };
  const handleDecChange = (v: string) => {
    const num = parseFloat(`${parts.integer || '0'}.${v || '0'}`);
    onChange(isNaN(num) ? 0 : num);
  };

  return (
    <span className="inline-flex items-baseline gap-0">
      <CellInput value={parts.integer} maxLength={12} onChange={handleIntChange} filter="digits" disabled={disabled} hasError={hasError} cellSize={cellSize} />
      <span className="mx-0.5 text-[10px] font-bold">.</span>
      <CellInput value={parts.decimal} maxLength={2} onChange={handleDecChange} filter="digits" disabled={disabled} hasError={hasError} cellSize={cellSize} />
    </span>
  );
}

function parseDateValue(isoDate: string): { day: string; month: string; year: string } {
  if (!isoDate || isoDate.length < 8) {
    const digits = isoDate?.replace(/\D/g, '') || '';
    return {
      day: digits.slice(0, 2),
      month: digits.slice(2, 4),
      year: digits.slice(4, 8),
    };
  }
  if (isoDate.includes('-')) {
    const [y, m, d] = isoDate.split('-');
    return { day: d || '', month: m || '', year: y || '' };
  }
  return { day: isoDate.slice(0, 2), month: isoDate.slice(2, 4), year: isoDate.slice(4, 8) };
}

function buildDate(day: string, month: string, year: string): string {
  if (!day && !month && !year) return '';
  if (year.length === 4 && month.length === 2 && day.length === 2) {
    return `${year}-${month}-${day}`;
  }
  return `${day}${month}${year}`;
}

function formatAmountParts(amount: number): { integer: string; decimal: string } {
  if (!amount || amount <= 0) return { integer: '', decimal: '' };
  const fixed = amount.toFixed(2);
  const [int, dec] = fixed.split('.');
  return { integer: int === '0' ? '' : int, decimal: dec };
}
