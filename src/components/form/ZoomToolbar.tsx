import { useCallback } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const DEFAULT_ZOOM = 1.25;

interface ZoomToolbarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function ZoomToolbar({ zoom, onZoomChange }: ZoomToolbarProps) {
  const currentIndex = ZOOM_STEPS.indexOf(zoom);

  const zoomIn = useCallback(() => {
    const nextIndex = ZOOM_STEPS.findIndex((s) => s > zoom);
    if (nextIndex !== -1) onZoomChange(ZOOM_STEPS[nextIndex]);
  }, [zoom, onZoomChange]);

  const zoomOut = useCallback(() => {
    let prevIndex = -1;
    for (let i = ZOOM_STEPS.length - 1; i >= 0; i--) {
      if (ZOOM_STEPS[i] < zoom) {
        prevIndex = i;
        break;
      }
    }
    if (prevIndex !== -1) onZoomChange(ZOOM_STEPS[prevIndex]);
  }, [zoom, onZoomChange]);

  const reset = useCallback(() => {
    onZoomChange(DEFAULT_ZOOM);
  }, [onZoomChange]);

  const canZoomIn = currentIndex < ZOOM_STEPS.length - 1;
  const canZoomOut = currentIndex > 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg px-1.5 py-1 print:hidden">
      <button
        type="button"
        onClick={zoomOut}
        disabled={!canZoomOut}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Уменьшить"
      >
        <ZoomOut className="w-4 h-4 text-gray-700" />
      </button>

      <button
        type="button"
        onClick={reset}
        className="min-w-[52px] px-2 py-1 text-xs font-medium text-gray-700 rounded hover:bg-gray-100 transition-colors text-center tabular-nums"
        title="Сбросить масштаб"
      >
        {Math.round(zoom * 100)}%
      </button>

      <button
        type="button"
        onClick={zoomIn}
        disabled={!canZoomIn}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Увеличить"
      >
        <ZoomIn className="w-4 h-4 text-gray-700" />
      </button>
    </div>
  );
}

export { DEFAULT_ZOOM };
