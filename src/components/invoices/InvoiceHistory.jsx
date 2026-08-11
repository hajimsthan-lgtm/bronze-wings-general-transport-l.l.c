import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Trash2, FileText, ClipboardList } from 'lucide-react';
import moment from 'moment';
import { useState } from 'react';

export default function InvoiceHistory() {
  const queryClient = useQueryClient();
  const [printing, setPrinting] = useState(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['invoiceRecords'],
    queryFn: () => base44.entities.InvoiceRecord.list('-date', 200),
  });

  const { data: settings = {} } = useQuery({
    queryKey: ['companySettings'],
    queryFn: getCompanySettings,
  });

  const handleDelete = async (rec) => {
    if (!confirm(`Delete ${rec.number}?`)) return;
    await base44.entities.InvoiceRecord.delete(rec.id);
    queryClient.invalidateQueries({ queryKey: ['invoiceRecords'] });
  };

  const handleReprint = (rec) => {
    setPrinting(rec.id);
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) { setPrinting(null); return; }

    const items = rec.items || [];
    const rows = items.map((it, i) => {
      // items are stored as strings like "Description — Qty: 1 — AED 50.00"
      const parts = it.split(' — ');
      const desc = parts[0] || it;
      const qty = parts[1]?.replace('Qty: ', '') || '1';
      const price = parts[2]?.replace('AED ', '') || '0';
      const amt = (parseFloat(price) * parseInt(qty)).toFixed(2);
      return `<tr style="border-bottom:1px solid #e5e7eb;${i % 2 ? 'background:#f9fafb;' : ''}">
        <td style="padding:8px 10px;font-size:12px;color:#6b7280;">${i + 1}</td>
        <td style="padding:8px 10px;font-size:12px;">${desc}</td>
        <td style="padding:8px 10px;font-size:12px;text-align:center;">${qty}</td>
        <td style="padding:8px 10px;font-size:12px;text-align:right;">AED ${price}</td>
        <td style="padding:8px 10px;font-size:12px;text-align:right;font-weight:600;">AED ${amt}</td>
      </tr>`;
    }).join('');

    const label = rec.type === 'invoice' ? 'INVOICE' : 'QUOTATION';
    w.document.write(`<!DOCTYPE html><html><head><title>${label} - ${rec.number}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif}
    body{background:#fff;color:#111;padding:40px;font-size:13px}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    thead tr{background:#1e40af;color:#fff}
    th{padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
    @media print{body{padding:24px}}</style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding:10px 14px;background:#FDFBF0;border:2px solid #633C1A;border-radius:8px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        ${settings.logo_url ? `<img src="${settings.logo_url}" style="height:56px;width:56px;border-radius:50%;object-fit:cover" />` : ''}
        <div>
          <div style="font-size:11px;color:#633C1A;font-weight:600">الاجنحه البرونزية للنقليات العامة - ذ.م.م</div>
          <h1 style="font-size:22px;font-weight:800;color:#633C1A;letter-spacing:2px;font-family:Georgia,serif">BRONZE WINGS</h1>
          <p style="font-size:10px;font-weight:600;color:#633C1A;letter-spacing:1px">GENERAL TRANSPORT - L.L.C</p>
        </div>
      </div>
      <div style="text-align:right">
        <div style="background:#8B3A2E;color:#fff;font-size:15px;font-weight:700;padding:5px 16px;border-radius:6px;display:inline-block;margin-bottom:8px">${label}</div>
        ${settings.trn ? `<p style="font-size:10px;color:#633C1A;font-weight:600;margin-bottom:4px">TRN: ${settings.trn}</p>` : ''}
        <p style="font-size:11px;color:#633C1A">Mob: ${settings.phone1 || ''}${settings.phone2 ? ' · ' + settings.phone2 : ''}</p>
        <p style="font-size:11px;color:#633C1A">${settings.email || ''}</p>
        <p style="font-size:11px;color:#633C1A">${settings.address || ''}</p>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:24px;margin-bottom:16px">
      <p style="font-size:11px;color:#6b7280">No: <strong style="color:#111">${rec.number}</strong></p>
      <p style="font-size:11px;color:#6b7280">Date: <strong style="color:#111">${moment(rec.date).format('DD MMM YYYY')}</strong></p>
      ${rec.due_date ? `<p style="font-size:11px;color:#6b7280">Due: <strong style="color:#e11d48">${moment(rec.due_date).format('DD MMM YYYY')}</strong></p>` : ''}
    </div>
    <div style="margin-bottom:20px">
      <p style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:4px">Bill To</p>
      <p style="font-size:14px;font-weight:700;color:#111">${rec.customer_name || ''}</p>
      ${rec.customer_mobile ? `<p style="font-size:11px;color:#6b7280">${rec.customer_mobile}</p>` : ''}
      ${rec.customer_address ? `<p style="font-size:11px;color:#6b7280">${rec.customer_address}</p>` : ''}
    </div>
    <table><thead><tr style="background:#1e40af;color:#fff">
      <th style="padding:8px 10px;text-align:left;font-size:10px">#</th>
      <th style="padding:8px 10px;text-align:left;font-size:10px">Description</th>
      <th style="padding:8px 10px;text-align:center;font-size:10px">Qty</th>
      <th style="padding:8px 10px;text-align:right;font-size:10px">Unit Price</th>
      <th style="padding:8px 10px;text-align:right;font-size:10px">Amount</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
      <table style="width:240px"><tbody><tr style="border-top:2px solid #1e40af">
        <td style="padding:8px;font-size:14px;font-weight:700;color:#1e40af">TOTAL</td>
        <td style="padding:8px;font-size:14px;font-weight:700;color:#1e40af;text-align:right">AED ${(rec.total || 0).toFixed(2)}</td>
      </tr></tbody></table>
    </div>
    ${rec.notes ? `<div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb"><p style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:4px">Notes</p><p style="font-size:11px;color:#374151">${rec.notes}</p></div>` : ''}
    <div style="margin-top:20px;padding:10px 14px;background:#FDFBF0;border-radius:8;border:1px solid #633C1A">
      <p style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#633C1A;margin-bottom:6px;font-weight:700">Bank Details</p>
      <p style="font-size:11px;color:#374151">Bank: ${settings.bank_name || '—'}</p>
      <p style="font-size:11px;color:#374151">Account: ${settings.bank_account_no || '—'} · IBAN: ${settings.bank_iban || '—'}</p>
    </div>
    <div style="margin-top:24px">
      <div style="background:#FDFBF0;border:2px solid #633C1A;color:#633C1A;text-align:center;padding:10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">
        ${settings.tagline || 'We Provide All Kinds of General and Refrigerated Transportation and Heavy Equipment Rental Services'}
      </div>
      <p style="text-align:right;font-size:9px;color:#d1d5db;margin-top:4px">Prepared by: ${rec.prepared_by || ''}</p>
    </div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); setPrinting(null); }, 300);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading history…</p>;

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
          <FileText className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No invoices or quotations yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Created documents will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((rec) => (
        <div key={rec.id} className="rounded-xl border border-border/50 bg-card p-3 flex items-center gap-3 hover:border-primary/30 transition-colors">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${rec.type === 'invoice' ? 'bg-primary/15' : 'bg-amber-500/15'}`}>
            {rec.type === 'invoice'
              ? <FileText className="w-4 h-4 text-primary" />
              : <ClipboardList className="w-4 h-4 text-amber-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground font-mono">{rec.number}</span>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {rec.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {rec.customer_name || '—'} · {moment(rec.date).format('DD MMM YYYY')}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-foreground tabular-nums">AED {(rec.total || 0).toFixed(2)}</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleReprint(rec)} disabled={printing === rec.id}>
              <Printer className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(rec)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}