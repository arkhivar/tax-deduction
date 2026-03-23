interface CellRowProps {
  chars: string[];
  cellSize?: number;
}

export function CellRow({ chars, cellSize = 16 }: CellRowProps) {
  return (
    <span className="inline-flex">
      {chars.map((ch, i) => (
        <span
          key={i}
          className="border border-black text-center font-mono leading-none"
          style={{
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            fontSize: `${cellSize - 4}px`,
            lineHeight: `${cellSize}px`,
            marginLeft: i > 0 ? '-1px' : '0',
          }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

interface LabeledCellsProps {
  label: string;
  chars: string[];
  cellSize?: number;
  className?: string;
}

export function LabeledCells({ label, chars, cellSize = 16, className = '' }: LabeledCellsProps) {
  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className="text-[10px] whitespace-nowrap">{label}</span>
      <CellRow chars={chars} cellSize={cellSize} />
    </span>
  );
}

interface DateCellsProps {
  day: string[];
  month: string[];
  year: string[];
  cellSize?: number;
}

export function DateCells({ day, month, year, cellSize = 16 }: DateCellsProps) {
  return (
    <span className="inline-flex items-baseline gap-0">
      <CellRow chars={day} cellSize={cellSize} />
      <span className="mx-0.5 text-[10px]">.</span>
      <CellRow chars={month} cellSize={cellSize} />
      <span className="mx-0.5 text-[10px]">.</span>
      <CellRow chars={year} cellSize={cellSize} />
    </span>
  );
}
