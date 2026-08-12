import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n';
import { formatCurrency, formatDate } from '@/lib/formatters';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Loader2, Repeat } from 'lucide-react';
import { generateNextInvoiceNumber } from '@/lib/invoiceSequence';
import StatusBadge from '@/components/common/StatusBadge';

export default function MonthlyContractsGenerator({ clientName, onInvoicesChanged }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoicingId, setInvoicingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.MonthlyContract.filter({ company_name: clientName })
      .catch(() => [])
      .then((r) => { if (!cancelled) setContracts(r || []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientName]);

  const invoiceContract = async (contract) => {
    setInvoicingId(contract.id);
    try {
      const subtotal = Number(contract.monthly_rate) || 0;
      const vatAmount = Math.round(subtotal * 0.05 * 100) / 100;
      const total = Math.round((subtotal + vatAmount) * 100) / 100;
      const now = new Date();
      const due = new Date(now); due.setDate(due.getDate() + 30);
      const invNo = await generateNextInvoiceNumber();
      let clientData = {};
      try {
        const clients = await base44.entities.Client.filter({ name: contract.company_name });
        clientData = clients?.[0] || {};
      } catch (e) {}
      await base44.entities.Invoice.create({
        invoice_number: invNo,
        client_name: contract.company_name,
        contact_person: clientData.contact_person || '',
        client_address: clientData.address || '',
        client_trn: clientData.trn || '',
        sub: contract.notes || '',
        reg_no: contract.vehicle_plate || '',
        issue_date: now.toISOString().split('T')[0],
        due_date: due.toISOString().split('T')[0],
        line_items: [{ description: `Monthly Contract - ${contract.company_name}\nDriver: ${contract.driver_name || '—'} | Vehicle: ${contract.vehicle_plate || '—'}`, quantity: 1, unit_price: subtotal, amount: subtotal }],
        subtotal, vat_rate: 5, vat_amount: vatAmount, total_amount: total, paid_amount: 0, status: 'draft',
      });
      toast({ title: t('invoice_created') || 'Invoice created' });
      onInvoicesChanged?.();
    } catch {
      toast({ title: 'Failed to create invoice', variant: 'destructive' });
    } finally {
      setInvoicingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /></div>;
  if (contracts.length === 0) return <EmptyState icon={Repeat} title="No monthly contracts" description="Active monthly contracts for this client appear here." />;

  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center"><Repeat className="w-4 h-4 text-violet-400" /></div>
        <div>
          <p className="text-sm font-semibold text-foreground">Monthly Contracts</p>
          <p className="text-[11px] text-muted-foreground">{contracts.length} contracts · generate invoices in one click</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {contracts.map((c) => {
          const active = c.status === 'active';
          return (
            <div key={c.id} className="row-card flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-violet-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.vehicle_plate || '—'} · {c.driver_name || '—'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Calendar className="w-3 h-3 flex-shrink-0" />{formatDate(c.start_date)} → {formatDate(c.end_date)}</p>
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums flex-shrink-0">{formatCurrency(c.monthly_rate)}</span>
              <StatusBadge status={c.status} />
              <Button
                onClick={() => invoiceContract(c)}
                disabled={invoicingId === c.id || !active}
                size="sm"
                className="h-8 bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25"
              >
                {invoicingId === c.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1" />}
                Invoice
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}