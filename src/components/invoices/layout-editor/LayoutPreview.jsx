import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// A4 at 96dpi ≈ 794 × 1123 px
const A4_W = 794;
const A4_H = 1123;

export default function LayoutPreview({ previewUrl, previewLoading, pageCount, validationErrors }) {
  const [zoom, setZoom] = useState(0.75);
  const [currentPage, setCurrentPage] = useState(1);
  const [fitToScreen, setFitToScreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => { setCurrentPage(1); }, [previewUrl]);

  // Fit-to-screen: calculate zoom from container width
  useEffect(() => {
    if (!fitToScreen || !containerRef.current) return;
    const cw = containerRef.current.clientWidth - 32;
    setZoom(Math.max(0.3, Math.min(1.5, cw / A4_W)));
  }, [fitToScreen, previewUrl]);

  const handleZoomIn  = () => { setFitToScreen(false); setZoom(z => Math.min(2, +(z + 0.1).toFixed(2))); };
  const handleZoomOut = () => { setFitToScreen(false); setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(2))); };
  const handleReset   = () => { setFitToScreen(false); setZoom(0.75); };
  const handleFit     = () => setFitToScreen(f => !f);

  const iframeSrc = previewUrl ? `${previewUrl}#page=${currentPage}` : '';
  const totalH = A4_H * (pageCount || 1);

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-muted/10">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Live Preview</span>
        <div className="flex items-center gap-1.5">
          {pageCount > 1 && (
            <div className="flex items-center gap-1 mr-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">Page {currentPage} of {pageCount}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={currentPage >= pageCount}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} disabled={zoom <= 0.3}><ZoomOut className="w-3.5 h-3.5" /></Button>
          <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} disabled={zoom >= 2}><ZoomIn className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleReset}>Reset</Button>
          <Button variant={fitToScreen ? 'default' : 'ghost'} size="icon" className="h-7 w-7" onClick={handleFit} title="Fit to screen">
            <Maximize className="w-3.5 h-3.5" />
          </Button>
          {previewLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-1" />}
        </div>
      </div>

      {/* Preview area */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 flex items-start justify-center">
        {validationErrors.length > 0 ? (
          <div className="text-center text-muted-foreground text-sm max-w-xs m-auto">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400/60" />
            Fix layout errors to see the preview
          </div>
        ) : !previewUrl ? (
          <div className="text-center text-muted-foreground text-sm m-auto">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary/60" />
            Generating preview...
          </div>
        ) : (
          <div style={{ width: A4_W * zoom, height: totalH * zoom, flexShrink: 0 }} className="relative">
            <iframe
              src={iframeSrc}
              className="rounded-lg shadow-lg bg-white"
              style={{
                width: A4_W,
                height: totalH,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                border: '1px solid hsl(var(--border) / 0.3)',
              }}
              title="Invoice Layout Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}