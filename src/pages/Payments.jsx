import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ExportButtons from '@/components/common/ExportButtons';
import PaymentFormSheet from '@/components/payments/PaymentFormSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Search, Receipt, Pencil, Wallet } from 'lucide-react';
import { useSheetUrlState } from '@/hooks/useSheetUrlState';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useClientPayments } from '@/hooks/useEntityQueries';
import SatinCard from '@/components/common/SatinCard';
import PageInfo from '@/components/common/PageInfo';

export default function Payments() {
  const { data: items = [], isLoading: loading, refetch } = useClientPayments();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useSheetUrlState('payment');
  const [editItem, setEditItem] = useState(null);

  const filtered = items.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.client_name || '').toLowerCase().includes(q) ||
           (p.reference_number || '').toLowerCase().includes(q) ||
           (p.notes || '').toLowerCase().includes(q);
  });

  const totalAllocated = filtered.reduce((s, p) =>
    s + (p.allocated_invoices || []).reduce((a, inv) => a + (inv.allocated_amount || 0), 0), 0);
  const totalUnapplied = filtered.reduce((s, p) => s + (p.unapplied_balance || 0), 0);

  return (
    <div>
      <PullToRefresh onRefresh={() => refetch()}>
        <PageHeader
          title="Client Payments & Notes"
          description={`${filtered.length} payment records`}
          action={
            <div className="flex items-center gap-2">
              <ExportButtons
                data={filtered}
                filename="client_payments"
                columns={[
                  { label: 'Reference', key: 'reference_number' },
                  { label: 'Date', key: 'payment_date' },
                  { label: 'Client', key: 'client_name' },
                  { label: 'Mode', key: 'payment_mode' },
                  { label: 'Amount', key: 'amount', numeric: true },
                  { label: 'Unapplied', key: 'unapplied_balance', numeric: true },
                ]}
                title="Client Payments Report"
              />
              <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Payment
              </Button>
            </div>
          }
        />
        <PageInfo text="Record client payments here. Enter the amount and the system auto-allocates it across outstanding invoices using FIFO (oldest first). Select or deselect invoices to control allocation." />

        <div className="grid grid-cols-2 gap-3 mb-5">
          <SatinCard className="p-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <p className="eyebrow">Total Allocated</p>
            </div>
            <p className="text-lg font-bold mt-1 text-emerald-300 tabular-nums font-display">{formatCurrency(totalAllocated)}</p>
          </SatinCard>
          <SatinCard className="p-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-400" />
              <p className="eyebrow">Unapplied Balance</p>
            </div>
            <p className="text-lg font-bold mt-1 text-amber-300 tabular-nums font-display">{formatCurrency(totalUnapplied)}</p>
          </SatinCard>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client, reference, or notes..."
            className="pl-9 bg-card border-border h-10"
          />
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No payment records" description="Add a bulk payment to auto-allocate against outstanding invoices." />
        ) : (
          <div className="space-y-2">
            {filtered.map(p => (
              <div key={p.id} className="glass-card-hover p-4 flex items-center gap-4 cursor-pointer" onClick={() => { setEditItem(p); setFormOpen(true); }}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{p.client_name || '—'}</p>
                    <span className="text-xs text-muted-foreground font-mono">{p.reference_number}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(p.payment_date)} · {p.payment_mode}
                    {p.notes ? ` · ${p.notes}` : ''}
                  </p>
                  {(p.allocated_invoices || []).length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {(p.allocated_invoices || []).slice(0, 3).map(inv => (
                        <span key={inv.invoice_id} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-muted-foreground">
                          {inv.invoice_number}: {formatCurrency(inv.allocated_amount)}
                        </span>
                      ))}
                      {(p.allocated_invoices || []).length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{(p.allocated_invoices || []).length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(p.amount)}</p>
                  {p.unapplied_balance > 0 && (
                    <p className="text-[10px] text-amber-400">Unapplied: {formatCurrency(p.unapplied_balance)}</p>
                  )}
                </div>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </PullToRefresh>

      <PaymentFormSheet open={formOpen} onOpenChange={setFormOpen} editItem={editItem} />
    </div>
  );
}