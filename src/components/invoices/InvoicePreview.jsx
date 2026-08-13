import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { buildInvoiceHTML, buildPerTripInvoiceHTML } from '@/lib/invoiceHtml';

const PAGE_W = 794;   // A4 @ 96dpi
const PAGE_H = 1123;

export default function InvoicePreview({ form, settings }) {
  const hasTripDates = (form.line_items || []).some(i => i.date);
  const html = useMemo(() => {
    const fn = hasTripDates ? buildPerTripInvoiceHTML : buildInvoiceHTML;
    return fn(form, form.client_name, settings || {});
  }, [form, settings, hasTripDates]);

  const wrapRef = useRef(null);
  const measurerRef = useRef(null);
  const [scale, setScale] = useState(0.62);
  const [contentH, setContentH] = useState(PAGE_H);

  // Fit page width to container
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const updateScale = () => {
      const w = el.clientWidth - 12;
      if (w > 0) setScale(Math.min(1, w / PAGE_W));
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure full unscaled content height to compute page count
  useLayoutEffect(() => {
    const el = measurerRef.current;
    if (!el) return;
    const measure = () => setContentH(el.scrollHeight || PAGE_H);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [html]);

  const pageCount = Math.max(1, Math.ceil(contentH / PAGE_H));

  return (
    <div
      ref={wrapRef}
      className="w-full h-full overflow-y-auto bg-muted/20 p-2 flex flex-col items-center gap-3"
    >
      {/* Hidden full-width measurer (unscaled) to determine total content height */}
      <div
        ref={measurerRef}
        aria-hidden
        style={{
          position: 'absolute',
          left: -99999,
          top: 0,
          width: PAGE_W,
          pointerEvents: 'none',
          opacity: 0,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {Array.from({ length: pageCount }).map((_, i) => (
        <div
          key={i}
          style={{
            width: PAGE_W * scale,
            height: PAGE_H * scale,
            position: 'relative',
            flexShrink: 0,
            overflow: 'hidden',
            background: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 6px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: PAGE_W,
              height: PAGE_H,
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `scale(${scale}) translateY(${-i * PAGE_H}px)`,
              transformOrigin: 'top left',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      ))}
    </div>
  );
}