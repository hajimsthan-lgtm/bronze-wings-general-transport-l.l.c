import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { buildInvoiceHTML, buildPerTripInvoiceHTML } from '@/lib/invoiceHtml';

const PAGE_W = 794;

export default function InvoicePreview({ form, settings }) {
  const hasTripDates = (form.line_items || []).some(i => i.date);
  const html = useMemo(() => {
    const fn = hasTripDates ? buildPerTripInvoiceHTML : buildInvoiceHTML;
    return fn(form, form.client_name, settings || {});
  }, [form, settings, hasTripDates]);

  const wrapRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(0.62);
  const [contentH, setContentH] = useState(1123);

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

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setContentH(el.scrollHeight || 1123);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [html]);

  return (
    <div ref={wrapRef} className="w-full h-full overflow-y-auto bg-muted/20 p-2 flex justify-center">
      <div style={{ width: PAGE_W * scale, height: contentH * scale, position: 'relative', flexShrink: 0 }}>
        <div
          ref={innerRef}
          style={{
            width: PAGE_W,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}