import { useRef } from 'react';
import { formatCurrency, formatDate } from '@/lib/formatters';

const LOGO_SIZES = { small: 40, medium: 60, large: 90 };
const TITLE_SIZES = { small: '1.25rem', medium: '1.5rem', large: '2rem' };
const ROW_HEIGHTS = { compact: '28px', comfortable: '40px' };
const MARGINS = { narrow: '24px', normal: '40px', wide: '56px' };

export default function TemplatePreview({
  template, invoice, settings, selectedSection, onSelectSection, onColumnResize, isMobile,
}) {
  const items = invoice?.line_items || [];
  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || (Number(i.quantity) || 0) * (Number(i.unit_price) || 0)), 0);
  const totalDiscount = items.reduce((s, i) => s + (Number(i.discount) || 0), 0);
  const vatRate = invoice?.vat_rate || settings?.default_vat_rate || 5;
  const vatAmount = subtotal * vatRate / 100;
  const total = subtotal + vatAmount;
  const paid = Number(invoice?.paid_amount || 0);
  const balance = Math.max(0, total - paid);
  const cols = template.table.columns.filter(c => c.visible);
  const h = template.header;
  const t = template.table;
  const c = template.content;
  const f = template.footer;
  const l = template.layout;

  const logoSize = LOGO_SIZES[h.logoSize] || 60;
  const logoUrl = settings?.inv_logo_source === 'custom' ? settings?.inv_logo_url : settings?.logo_url;
  const pageWidth = isMobile ? '100%' : '800px';
  const pageMaxWidth = isMobile ? '480px' : '800px';
  const pagePadding = MARGINS[l.margin] || '40px';

  const startColResize = (e, colIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = cols[colIndex].width;
    const tableEl = e.currentTarget.closest('table');
    const tableWidth = tableEl?.offsetWidth || 800;

    const onMove = (ev) => {
      const delta = ((ev.clientX - startX) / tableWidth) * 100;
      const newWidth = Math.max(5, Math.min(60, startWidth + delta));
      onColumnResize(cols[colIndex].key, newWidth);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const renderCell = (item, colKey) => {
    switch (colKey) {
      case 'description': return item.description || '—';
      case 'date': return item.date ? formatDate(item.date) : '—';
      case 'quantity': return Number(item.quantity || 0);
      case 'unit_price': return formatCurrency(item.unit_price || 0);
      case 'discount': return item.discount ? formatCurrency(item.discount) : '—';
      case 'amount': return formatCurrency(item.amount || 0);
      default: return '—';
    }
  };

  const sectionRing = (key) =>
    selectedSection === key ? 'outline outline-2 outline-blue-400 outline-offset-2 cursor-pointer' : 'cursor-pointer hover:outline hover:outline-1 hover:outline-blue-200';

  return (
    <div className="flex justify-center overflow-auto thin-scroll p-4 lg:p-8 h-full bg-muted/20 rounded-xl">
      <div
        className="bg-white text-black shadow-2xl rounded-lg flex flex-col"
        style={{ width: pageWidth, maxWidth: pageMaxWidth, minHeight: '100%', padding: pagePadding, fontFamily: 'Inter, sans-serif' }}
      >
        {/* ===== HEADER ===== */}
        <div
          onClick={(e) => { e.stopPropagation(); onSelectSection('header'); }}
          className={`pb-4 mb-4 border-b-2 ${sectionRing('header')}`}
          style={{ borderColor: h.accentColor }}
        >
          <div className="flex items-start justify-between" style={{ flexDirection: h.logoPosition === 'right' ? 'row-reverse' : h.logoPosition === 'center' ? 'column' : 'row' }}>
            {/* Logo */}
            {logoUrl && (
              <img src={logoUrl} alt="Logo" style={{ width: logoSize, height: logoSize, objectFit: 'contain' }} className="mb-2" />
            )}
            {/* Company info */}
            <div className={`text-xs ${h.companyInfoPlacement === 'left' ? 'text-left' : 'text-right'}`} style={{ maxWidth: '50%' }}>
              <p className="font-bold text-sm" style={{ color: settings?.inv_header_text || '#000' }}>{settings?.company_name || 'Company Name'}</p>
              {settings?.address && <p className="text-gray-600 mt-0.5">{settings.address}</p>}
              {settings?.phone1 && <p className="text-gray-600">{settings.phone1}</p>}
              {settings?.email && <p className="text-gray-600">{settings.email}</p>}
              {settings?.trn && <p className="text-gray-600">TRN: {settings.trn}</p>}
            </div>
          </div>

          {/* Invoice title + meta */}
          <div className="flex items-end justify-between mt-4">
            <h1
              style={{
                fontSize: TITLE_SIZES[h.titleFontSize],
                fontWeight: h.titleWeight === 'bold' ? 700 : 400,
                color: h.accentColor,
              }}
            >
              INVOICE
            </h1>
            <div className="text-xs text-right space-y-0.5">
              {h.showInvoiceNumber && <p><span className="text-gray-500">Invoice #:</span> <span className="font-semibold">{invoice?.invoice_number || 'BW-0001'}</span></p>}
              {h.showIssueDate && <p><span className="text-gray-500">Issue Date:</span> {invoice?.issue_date ? formatDate(invoice.issue_date) : '—'}</p>}
              {h.showDueDate && <p><span className="text-gray-500">Due Date:</span> {invoice?.due_date ? formatDate(invoice.due_date) : '—'}</p>}
              {h.showStatusBadge && (
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">{invoice?.status || 'draft'}</span>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="mt-3 text-xs">
            <p className="text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Bill To</p>
            <p className="font-semibold">{invoice?.client_name || 'Client Name'}</p>
            {invoice?.client_address && <p className="text-gray-600">{invoice.client_address}</p>}
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <div
          onClick={(e) => { e.stopPropagation(); onSelectSection('table'); }}
          className={`mb-4 ${sectionRing('table')}`}
        >
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{
                background: t.headerRowBg ? (settings?.inv_header_bg || '#f0f0f0') : 'transparent',
                borderBottom: t.borderStyle !== 'none' ? `2px solid ${h.accentColor}` : 'none',
              }}>
                {cols.map((col, ci) => (
                  <th
                    key={col.key}
                    style={{
                      width: `${col.width}%`,
                      textAlign: col.align,
                      fontWeight: t.headerRowBold ? 700 : 400,
                      textTransform: t.headerRowUppercase ? 'uppercase' : 'none',
                      fontSize: '11px',
                      padding: '8px 6px',
                      color: settings?.inv_header_text || '#000',
                      borderRight: t.borderStyle === 'full' ? '1px solid #ddd' : 'none',
                      position: 'relative',
                    }}
                  >
                    {col.label}
                    {/* Drag handle */}
                    <div
                      onMouseDown={(e) => startColResize(e, ci)}
                      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/40 transition-colors"
                      style={{ marginRight: '-3px' }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={cols.length} className="text-center text-gray-400 py-4 text-xs">No line items</td></tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      background: t.zebraStriping && idx % 2 === 1 ? (settings?.inv_row_alt_bg || '#fafbfc') : 'transparent',
                      height: ROW_HEIGHTS[t.rowHeight],
                      borderBottom: t.borderStyle !== 'none' ? '1px solid #e5e5e5' : 'none',
                    }}
                  >
                    {cols.map(col => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align,
                          padding: '6px',
                          color: settings?.inv_row_text || '#000',
                          borderRight: t.borderStyle === 'full' ? '1px solid #ddd' : 'none',
                          fontSize: '11px',
                        }}
                      >
                        {renderCell(item, col.key)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===== CONTENT: Notes + Totals ===== */}
        <div
          onClick={(e) => { e.stopPropagation(); onSelectSection('content'); }}
          className={`flex flex-col gap-3 ${sectionRing('content')}`}
        >
          {/* Notes (above totals) */}
          {c.showNotes && c.notesPosition === 'above' && invoice?.notes && (
            <div className="text-xs text-gray-600 border-l-2 pl-2" style={{ borderColor: h.accentColor }}>
              <p className="font-semibold text-gray-700 mb-0.5">Notes</p>
              <p>{invoice.notes}</p>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-1/2 space-y-1 text-xs">
              {c.showSubtotal && (
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
              )}
              {c.showDiscount && totalDiscount > 0 && (
                <div className="flex justify-between"><span className="text-gray-600">Discount</span><span className="tabular-nums">−{formatCurrency(totalDiscount)}</span></div>
              )}
              {c.showTax && (
                <div className="flex justify-between"><span className="text-gray-600">VAT ({vatRate}%)</span><span className="tabular-nums">{formatCurrency(vatAmount)}</span></div>
              )}
              {c.showTotal && (
                <div className="flex justify-between font-bold pt-1 border-t border-gray-300">
                  <span>Total</span><span className="tabular-nums">{formatCurrency(total)}</span>
                </div>
              )}
              {c.showBalanceDue && (
                <div
                  className="flex justify-between pt-1.5 mt-1 border-t-2"
                  style={{ borderColor: h.accentColor, fontWeight: c.totalEmphasis ? 700 : 400, fontSize: c.totalEmphasis ? '14px' : '11px' }}
                >
                  <span>Balance Due</span><span className="tabular-nums">{formatCurrency(balance)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes (below totals) */}
          {c.showNotes && c.notesPosition === 'below' && invoice?.notes && (
            <div className="text-xs text-gray-600 border-l-2 pl-2" style={{ borderColor: h.accentColor }}>
              <p className="font-semibold text-gray-700 mb-0.5">Notes</p>
              <p>{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* ===== FOOTER ===== */}
        <div
          onClick={(e) => { e.stopPropagation(); onSelectSection('footer'); }}
          className={`mt-auto pt-4 ${sectionRing('footer')}`}
          style={{ borderTop: f.showDivider ? '1px solid #ddd' : 'none', textAlign: f.alignment }}
        >
          {f.showPaymentInstructions && (
            <p className="text-[10px] text-gray-500 mb-1">Please make payment within the due date.</p>
          )}
          {f.showBankDetails && settings?.bank_name && (
            <div className="text-[10px] text-gray-500 mb-1">
              <span className="font-semibold">Bank:</span> {settings.bank_name} — {settings.bank_iban || settings.bank_account_no || ''}
            </div>
          )}
          {f.showThankYouNote && <p className="text-[10px] text-gray-500 mb-2">Thank you for your business!</p>}
          {f.showSignatureLine && (
            <div className="flex justify-end mt-3">
              <div className="text-center">
                <div className="w-32 border-t border-gray-400 mb-1" />
                <span className="text-[10px] text-gray-500">Authorized Signature</span>
              </div>
            </div>
          )}
          {f.showPageNumbers && <p className="text-[10px] text-gray-400 mt-2">Page 1 of 1</p>}
        </div>
      </div>
    </div>
  );
}