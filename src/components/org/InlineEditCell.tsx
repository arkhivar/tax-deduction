import { useState, useRef, useEffect, type ReactNode } from 'react';

interface InlineEditCellProps {
  /** Raw value used to prefill the input when editing starts. */
  value: string;
  /** Returns true when the value was saved; false keeps the input open with an error ring. */
  onSave: (raw: string) => Promise<boolean>;
  /** When true, the cell is plain read-only text. */
  disabled?: boolean;
  /** Formatted display content (non-editing state). */
  children: ReactNode;
  className?: string;
  inputClassName?: string;
  title?: string;
}

/**
 * Airtable-style inline edit cell: click the value to edit it in place.
 * Enter/blur saves, Esc cancels. Save errors keep the input open.
 */
export function InlineEditCell({
  value,
  onSave,
  disabled,
  children,
  className,
  inputClassName,
  title,
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Prevents a blur-triggered save right after Esc-cancel unmounts focus
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const start = () => {
    if (disabled) return;
    setDraft(value);
    setError(false);
    cancelledRef.current = false;
    setEditing(true);
  };

  const save = async () => {
    if (saving) return;
    if (draft.trim() === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(false);
    const ok = await onSave(draft.trim());
    setSaving(false);
    if (ok) setEditing(false);
    else setError(true);
  };

  const cancel = () => {
    cancelledRef.current = true;
    setEditing(false);
  };

  if (!editing) {
    return (
      <span
        onClick={start}
        title={disabled ? undefined : title || 'Нажмите для редактирования'}
        className={
          disabled
            ? className
            : `${className || ''} cursor-text rounded px-1 -mx-1 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-colors`
        }
      >
        {children}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        setError(false);
      }}
      onBlur={() => {
        if (!cancelledRef.current) save();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          save();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        }
      }}
      disabled={saving}
      className={`w-full px-1 py-0.5 rounded border text-sm bg-white
        focus:outline-none focus:ring-2 disabled:opacity-50
        ${error ? 'border-red-300 focus:ring-red-500/30' : 'border-blue-300 focus:ring-blue-500/30'}
        ${inputClassName || ''}`}
    />
  );
}
