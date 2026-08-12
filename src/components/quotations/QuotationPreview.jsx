import { useMemo } from 'react';
import { numberToWords } from '@/lib/numberToWords';

const MAROON = '#8B3A2E';
const DARK_BLUE = '#6B2A20';
const BROWN = '#633C1A';
const CREAM = '#FDFBF0';
const BRONZE = '#C4A35A';
const BLACK = '#000000';
const GRAY = '#666666';
const LIGHT_GRAY = '#DDDDDD';
const ROW_ALT = '#FAFBFC';

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtMoney(n) {
  return Number(n ?? 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

const logoSvg = `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><circle cx="50" cy="50" r="46" fill="none" stroke="${MAROON}" stroke-width="2"/><circle cx="50" cy="50" r="40" fill="none" stroke="${MAROON}" stroke-width="1" stroke-dasharray="3,2"/><circle cx="50" cy="50" r="28" fill="none" stroke="${BRONZE}" stroke-width="2"/><text x="50" y="46" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="700" fill="${MAROON}">BW</text><text x="50" y="58" text-anchor="middle" font-family="Arial,sans-serif" font-size="6" font-weight="600" fill="${MAROON}">L.L.C</text></svg>`;

export default function QuotationPreview({ form, settings }) {
  const s = settings || {};

  const { subtotal, vatAmount, total, vatRate } = useMemo(() => {
    const sub = (form.line_items || []).reduce((sum, i) => {
      const q = Number(i.quantity) || 0;
      const p = Number(i.unit_price) || 0;
      return sum + Number(i.amount ?? (q * p));
    }, 0);
    const rate = Number(form.vat_rate) || 0;
    const vat = sub * rate / 100;
    return { subtotal: sub, vatAmount: vat, total: sub + vat, vatRate: rate };
  }, [form.line_items, form.vat_rate]);

  const items = form.line_items || [];

  return (
    <div className="w-full h-full overflow-y-auto bg-muted/20 p-2 flex justify-center">
      <div
        className="bg-white shadow-lg"
        style={{
          width: '100%',
          maxWidth: '595px',
          minHeight: '842px',
          fontFamily: "'Times New Roman', Georgia, serif",
          fontSize: '10pt',
          color: BLACK,
          border: `2px solid ${MAROON}`,
          padding: '6px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Inner border */}
        <div style={{ border: `0.5px solid ${LIGHT_GRAY}`, flex: 1, padding: '4px', display: 'flex', flexDirection: 'column' }}>
          {/* Letterhead */}
          <div style={{ border: `1px solid ${BROWN}`, background: CREAM, padding: '6px 10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ width: '48px', height: '48px', flexShrink: 0 }}>
              {s.logo_url ? <img src={s.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div dangerouslySetInnerHTML={{ __html: logoSvg }} />}
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '9px', color: BROWN, fontWeight: 600, lineHeight: 1.3, fontFamily: "'Arial', sans-serif" }}>الاجنحه البرونزية للنقليات العامة - ذ.م.م</div>
              <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '18px', fontWeight: 'bold', color: BROWN, letterSpacing: '1.5px', lineHeight: 1.1, marginTop: '2px' }}>BRONZE WINGS</div>
              <div style={{ fontFamily: "'Arial', sans-serif", fontSize: '9px', fontWeight: 600, color: BROWN, letterSpacing: '0.8px', marginTop: '1px' }}>GENERAL TRANSPORT - L.L.C</div>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right', fontSize: '8px', color: BROWN, lineHeight: 1.5 }}>
              {s.phone1 && <div>Mob: {esc(s.phone1)}</div>}
              {s.phone2 && <div>Mob: {esc(s.phone2)}</div>}
              {s.email && <div>{esc(s.email)}</div>}
              {s.address && <div>{esc(s.address)}</div>}
              {s.website && <div>{esc(s.website)}</div>}
            </div>
          </div>

          {/* Quotation Banner */}
          <div style={{ textAlign: 'center', padding: '6px 0', fontSize: '13px', fontWeight: 'bold', color: DARK_BLUE, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            QUOTATION
          </div>

          {/* Billing Section */}
          <div style={{ border: `0.5px solid ${LIGHT_GRAY}`, display: 'flex', minHeight: '60px' }}>
            {/* Left: Quote To */}
            <div style={{ flex: 1, padding: '6px 8px', borderRight: `0.5px solid ${LIGHT_GRAY}` }}>
              <div style={{ fontSize: '9px', fontWeight: 'bold', color: MAROON, textTransform: 'uppercase', borderBottom: `1px solid ${MAROON}`, display: 'inline-block', paddingBottom: '1px', marginBottom: '4px' }}>QUOTE TO</div>
              <div style={{ fontSize: '9px', color: BLACK, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 'bold', fontSize: '9.5px' }}>{esc(form.client_name || '—')}</div>
                {form.contact_person && <div>ATT: {esc(form.contact_person)}</div>}
                {form.client_address && <div>ADDRESS: {esc(form.client_address)}</div>}
                {form.client_phone && <div>PHONE: {esc(form.client_phone)}</div>}
                {form.client_email && <div>EMAIL: {esc(form.client_email)}</div>}
                {form.client_trn && <div>TRN: {esc(form.client_trn)}</div>}
              </div>
            </div>
            {/* Right: Quotation #, Date, Valid Until, Subject */}
            <div style={{ width: '180px', padding: '6px 8px', fontSize: '9px', color: BLACK, lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}><span style={{ fontWeight: 'normal' }}>QUOTATION #:</span><span>{esc(form.quotation_number || '—')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}><span style={{ fontWeight: 'normal' }}>DATE:</span><span>{fmtDate(form.issue_date)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}><span style={{ fontWeight: 'normal' }}>VALID UNTIL:</span><span>{fmtDate(form.valid_until)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}><span style={{ fontWeight: 'normal' }}>SUBJECT:</span><span style={{ textAlign: 'right' }}>{esc(form.subject || '—')}</span></div>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', tableLayout: 'fixed', marginTop: '4px' }}>
            <thead>
              <tr>
                {['SL.\nNo', 'DESCRIPTION', 'QTY', 'UNIT\nPRICE', 'AMOUNT'].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      background: '#f0f0f0',
                      color: BLACK,
                      fontWeight: 'bold',
                      fontSize: '8px',
                      textTransform: 'uppercase',
                      padding: '4px 2px',
                      border: '0.5px solid black',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      whiteSpace: 'pre-line',
                      width: ['8%', '52%', '10%', '15%', '15%'][i],
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '8px', border: '0.5px solid black', textAlign: 'center', color: '#999' }}>No items</td></tr>
              ) : items.map((item, idx) => {
                const qty = Number(item.quantity) || 0;
                const unitPrice = Number(item.unit_price) || 0;
                const amount = Number(item.amount ?? (qty * unitPrice));
                return (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : ROW_ALT }}>
                    <td style={{ padding: '4px 2px', border: '0.5px solid black', textAlign: 'center', color: BLACK }}>{idx + 1}</td>
                    <td style={{ padding: '4px 4px', border: '0.5px solid black', textAlign: 'left', color: BLACK, fontWeight: 'bold', lineHeight: 1.4, wordWrap: 'break-word' }}>{esc(item.description || '')}</td>
                    <td style={{ padding: '4px 2px', border: '0.5px solid black', textAlign: 'center', color: BLACK }}>{qty}</td>
                    <td style={{ padding: '4px 2px', border: '0.5px solid black', textAlign: 'center', color: BLACK, fontFamily: "'Courier New', monospace", fontWeight: 'bold' }}>{fmtMoney(unitPrice)}</td>
                    <td style={{ padding: '4px 2px', border: '0.5px solid black', textAlign: 'center', color: BLACK, fontFamily: "'Courier New', monospace", fontWeight: 'bold' }}>{fmtMoney(amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', gap: 0, marginTop: '4px' }}>
            {/* Amount in Words */}
            <div style={{ flex: 1, border: `1px dashed #333`, padding: '5px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '7.5px', fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>Amount in Words:</div>
              <div style={{ fontSize: '8.5px', fontWeight: 'bold', color: BLACK, textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.3 }}>
                AED {numberToWords(total).toUpperCase()}
              </div>
            </div>
            {/* Subtotal / VAT / Total */}
            <div style={{ width: '150px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', borderBottom: '0.5px solid #E0E0E0', fontSize: '8.5px' }}>
                <span style={{ color: '#333', fontWeight: 600 }}>Subtotal:</span>
                <span style={{ color: BLACK, fontWeight: 'bold', fontFamily: "'Courier New', monospace" }}>AED {fmtMoney(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', borderBottom: '0.5px solid #E0E0E0', fontSize: '8.5px' }}>
                <span style={{ color: '#333', fontWeight: 600 }}>VAT ({vatRate}%):</span>
                <span style={{ color: BLACK, fontWeight: 'bold', fontFamily: "'Courier New', monospace" }}>AED {fmtMoney(vatAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderTop: '1px solid black', borderBottom: '1px solid black', fontSize: '9px' }}>
                <span style={{ color: BLACK, fontWeight: 'bold' }}>Total Amount:</span>
                <span style={{ color: BLACK, fontWeight: 'bold', fontFamily: "'Courier New', monospace" }}>AED {fmtMoney(total)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {(form.terms_conditions || form.notes) && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ background: '#f0f0f0', color: BLACK, fontWeight: 'bold', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '3px 6px' }}>
                TERMS &amp; CONDITIONS
              </div>
              <div style={{ padding: '3px 6px', fontSize: '8px', color: '#333', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {esc(form.terms_conditions || form.notes || '')}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1, minHeight: '10px' }} />

          {/* Signatures */}
          <div style={{ display: 'flex', marginTop: '12px', gap: '8px' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px' }}>AUTHORIZED BY</div>
              <div style={{ borderTop: '0.5px solid #333', marginBottom: '2px', width: '80%', margin: '0 auto' }} />
              <div style={{ fontSize: '7.5px', color: GRAY }}>Authorized Signature</div>
              <div style={{ fontSize: '8px', fontWeight: 'bold', color: BLACK, marginTop: '2px' }}>BRONZE WINGS GENERAL TRANSPORT L.L.C</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px' }}>ACCEPTED BY</div>
              <div style={{ borderTop: '0.5px solid #333', marginBottom: '2px', width: '80%', margin: '0 auto' }} />
              <div style={{ fontSize: '7.5px', color: GRAY }}>Client Signature</div>
              <div style={{ fontSize: '8px', fontWeight: 'bold', color: BLACK, marginTop: '2px', wordBreak: 'break-word' }}>{esc(form.client_name || '—')}</div>
            </div>
          </div>

          {/* Footer Banner */}
          <div style={{ marginTop: '8px', border: `0.5px solid ${BROWN}`, background: CREAM, padding: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '7.5px', fontWeight: 'bold', color: BROWN, letterSpacing: '0.5px' }}>
              WE PROVIDE ALL KINDS OF GENERAL AND REFRIGERATED TRANSPORTATION AND HEAVY EQUIPMENT RENTAL SERVICES
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}