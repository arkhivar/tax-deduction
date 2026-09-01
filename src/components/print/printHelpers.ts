export function padChars(value: string | null | undefined, length: number): string[] {
  const chars = (value || '').split('');
  const result: string[] = [];
  for (let i = 0; i < length; i++) {
    result.push(chars[i] || '');
  }
  return result;
}

export function formatDateToCells(dateStr: string | null | undefined): { day: string[]; month: string[]; year: string[] } {
  if (!dateStr) {
    return { day: ['', ''], month: ['', ''], year: ['', '', '', ''] };
  }
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  return {
    day: day.split(''),
    month: month.split(''),
    year: year.split(''),
  };
}

export function formatAmountToCells(amount: number): { integer: string[]; decimal: string[] } {
  const parts = amount.toFixed(2).split('.');
  return {
    integer: padChars(parts[0].padStart(12, ' '), 12),
    decimal: padChars(parts[1], 2),
  };
}

export function splitTextToLines(text: string, charsPerLine: number): string[][] {
  const lines: string[][] = [];
  let remaining = text;
  while (remaining.length > 0 || lines.length === 0) {
    const line = remaining.slice(0, charsPerLine);
    lines.push(padChars(line, charsPerLine));
    remaining = remaining.slice(charsPerLine);
    if (lines.length >= 4) break;
  }
  while (lines.length < 4) {
    lines.push(padChars('', charsPerLine));
  }
  return lines;
}
