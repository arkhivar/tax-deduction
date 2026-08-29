interface CornerSquaresProps {
  size?: string; // CSS length, e.g. '6mm', '8mm'. Defaults to 6mm.
}

export function CornerSquares({ size = '6mm' }: CornerSquaresProps) {
  return (
    <>
      <span
        aria-hidden
        className="absolute pointer-events-none bg-black print:break-inside-avoid"
        style={{ top: 0, left: 0, width: size, height: size }}
      />
      <span
        aria-hidden
        className="absolute pointer-events-none bg-black print:break-inside-avoid"
        style={{ top: 0, right: 0, width: size, height: size }}
      />
      <span
        aria-hidden
        className="absolute pointer-events-none bg-black print:break-inside-avoid"
        style={{ bottom: 0, left: 0, width: size, height: size }}
      />
      <span
        aria-hidden
        className="absolute pointer-events-none bg-black print:break-inside-avoid"
        style={{ bottom: 0, right: 0, width: size, height: size }}
      />
    </>
  );
}
