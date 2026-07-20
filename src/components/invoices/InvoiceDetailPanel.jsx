import { Download, CheckCircle, Pencil, CreditCard, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function InvoiceDetailPanel({ invoice, onEdit, onDownload, onMarkPaid, onDelete, downloadingId }) {
  const navigate = useNavigate();

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm py-20">
        Select an invoice to view details
      </div>
    );
  }

  const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
  const items = invoice.line_items || [];

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">Invoice details</p>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            #{invoice.invoice_number || invoice.id.slice(-6)}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Company: {invoice.client_name || '—'}</p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize ${
            invoice.status === 'paid' ? 'bg-[#A6FF00]/20 text-[#5c8a00]' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {invoice.status?.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">Customer</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            {invoice.contact_person || invoice.client_name}
          </p>
          {invoice.client_email && <p className="text-xs text-slate-400">{invoice.client_email}</p>}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">Due date</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{formatDate(invoice.due_date)}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No line items</p>
        ) : (
          items.map((it, i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{it.description || 'Item'}</p>
                <p className="text-xs text-slate-400">
                  {it.quantity} × {formatCurrency(it.unit_price)}
                </p>
              </div>
              <p className="text-sm font-bold text-slate-800">{formatCurrency(it.amount)}</p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-500">
          <span>Sub Total</span>
          <span>{formatCurrency(invoice.subtotal || 0)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>VAT ({invoice.vat_rate || 0}%)</span>
          <span>{formatCurrency(invoice.vat_amount || 0)}</span>
        </div>
        <div className="flex justify-between font-semibold text-slate-800">
          <span>Total</span>
          <span>{formatCurrency(invoice.total_amount || 0)}</span>
        </div>
        <div className="flex justify-between font-bold text-slate-900">
          <span>Balance Due</span>
          <span>{formatCurrency(balance)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-6">
        <Button
          onClick={() => navigate('/payments')}
          className="bg-[#A6FF00] hover:bg-[#A6FF00]/90 text-black font-semibold h-9"
        >
          <CreditCard className="w-4 h-4 mr-1.5" /> Record payment
        </Button>
        {invoice.status !== 'paid' && (
          <Button
            onClick={() => onMarkPaid(invoice)}
            variant="outline"
            className="h-9 border-slate-200 text-slate-700"
          >
            <CheckCircle className="w-4 h-4 mr-1.5" /> Mark paid
          </Button>
        )}
        <Button
          onClick={() => onEdit(invoice)}
          variant="outline"
          className="h-9 border-slate-200 text-slate-700"
        >
          <Pencil className="w-4 h-4 mr-1.5" /> Edit
        </Button>
        <Button
          onClick={() => onDownload(invoice)}
          variant="outline"
          className="h-9 border-slate-200 text-slate-700"
          disabled={downloadingId === invoice.id}
        >
          {downloadingId === invoice.id ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1.5" />
          )}{' '}
          PDF
        </Button>
        <Button
          onClick={() => onDelete(invoice)}
          variant="outline"
          className="h-9 border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1.5" /> Delete
        </Button>
      </div>
    </div>
  );
}