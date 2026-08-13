import { useMemo, useRef, useState, useEffect } from 'react';
import { buildInvoiceHTML } from '@/lib/invoiceHtml';

const PAGE_W = 794;
const PAGE_H = 1123;

export default function InvoicePreview({ form, settings }) {
  const html = useMemo(
    () => buildInvoiceHTML(form, form.client_name, settings || {}),
    [form, settings]
  );
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff;}*{box-sizing:border-box;}</style></head><body>${html}</body></html>`;

  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.65);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth - 16;
      if (w > 0) setScale(Math.min(1, w / PAGE_W));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full h-full overflow-y-auto bg-muted/20 p-2 flex justify-center">
      <div style={{ width: PAGE_W * scale, height: PAGE_H * scale, position: 'relative', flexShrink: 0 }}>
        <iframe
          title="Invoice Preview"
          srcDoc={doc}
          style={{
            width: `${PAGE_W}px`,
            height: `${PAGE_H}px`,
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background: '#fff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            borderRadius: '4px',
          }}
        />
      </div>
    </div>
  );
}