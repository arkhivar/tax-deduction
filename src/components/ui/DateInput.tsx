import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  /** Value in ISO format yyyy-mm-dd (or empty string) */
  value: string;
  /** Called with ISO yyyy-mm-dd when a valid date is entered, or '' when cleared */
  onChange: (iso: string) => void;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

/**
 * Formats whatever the user typed into dd.mm.yyyy display form.
 * Strips non-digits, inserts dots after position 2 and 5.
 */
function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = digits;
  if (digits.length > 4) {
    out = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  } else if (digits.length > 2) {
    out = `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }
  return out;
}

/**
 * Converts a masked dd.mm.yyyy string into ISO yyyy-mm-dd.
 * Returns '' if the date is incomplete or invalid.
 */
function maskedToIso(masked: string): string {
  const m = masked.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return '';
  const [, dd, mm, yyyy] = m;
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  // Basic validity check (allows real calendar validation via Date)
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return '';
  }
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Converts ISO yyyy-mm-dd to dd.mm.yyyy for display.
 * Returns '' for empty/invalid input.
 */
function isoToMasked(iso: string): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, hasError, placeholder = 'дд.мм.гггг', className = '', id, name, required }, ref) => {
    // Local display state so the user can type freely
    const [display, setDisplay] = useState(() => isoToMasked(value));
    // Ref to the hidden native date input that provides the calendar widget
    const hiddenDateRef = useRef<HTMLInputElement>(null);

    // Sync from outside (e.g. form reset, programmatic change)
    useEffect(() => {
      const expected = isoToMasked(value);
      setDisplay((prev) => (prev === expected ? prev : expected));
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskDate(e.target.value);
        setDisplay(masked);
        const iso = maskedToIso(masked);
        // Only propagate to parent when we have a complete valid date,
        // or when the field is cleared.
        if (masked === '' || iso) {
          onChange(iso);
        }
      },
      [onChange],
    );

    // When user picks a date from the native calendar widget
    const handlePickerChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const iso = e.target.value; // native date input gives yyyy-mm-dd
        if (iso) {
          setDisplay(isoToMasked(iso));
          onChange(iso);
        }
      },
      [onChange],
    );

    const openPicker = useCallback(() => {
      const el = hiddenDateRef.current;
      if (el && typeof el.showPicker === 'function') {
        el.showPicker();
      } else if (el) {
        // Fallback for browsers without showPicker()
        el.click();
      }
    }, []);

    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={display}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-3 py-2.5 pr-10 rounded-lg border bg-white text-gray-900
            placeholder:text-gray-400 text-sm
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-1
            ${hasError
              ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400'
            }
            ${className}
          `}
        />
        {/* Calendar icon button — opens native date picker */}
        <button
          type="button"
          onClick={openPicker}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
          aria-label="Выбрать дату"
        >
          <Calendar className="w-4 h-4" />
        </button>
        {/* Hidden native date input that provides the calendar widget.
            NOT using sr-only (clip:rect(0,0,0,0) + 1×1px) because some
            browsers truncate the picker popup to match the clipped size.
            Instead: real dimensions but fully transparent and non-interactive. */}
        <input
          ref={hiddenDateRef}
          type="date"
          value={value || ''}
          onChange={handlePickerChange}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none',
            border: 'none',
            padding: 0,
          }}
        />
      </div>
    );
  },
);

DateInput.displayName = 'DateInput';
