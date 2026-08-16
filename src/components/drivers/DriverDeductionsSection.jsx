import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Home, Car, FileText, Wallet, Wrench, Package, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import DriverDeductionFormSheet from './DriverDeductionFormSheet';
import EmptyState from '@/components/common/EmptyState';
import QuickViewModal from './QuickViewModal';

const TYPE_META = {
  housing_advance: { icon: Home, label: 'Housing Advance' },
  vehicle_loan: { icon: Car, label: 'Vehicle Loan' },
  traffic_fine: { icon: FileText, label: 'Traffic Fine' },
  salary_advance: { icon: Wallet, label: 'Salary Advance' },
  equipment: { icon: Wrench, label: 'Equipment' },
  other: { icon: Package, label: 'Other' },
};

const STATUS_META = {
  active: { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Active' },
  paused: { dot: 'bg-amber-400', text: 'text-amber-400', label: 'Paused' },
  completed: { dot: 'bg-muted-foreground', text: 'text-muted-foreground', label: 'Completed' },
};

export default function DriverDeductionsSection({ driverName }) {
  const { toast } = useToast();
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.DriverDeduction.filter({ driver_name: driverName }).catch(() => []);
      setDeductions(res || []);
    } finally { setLoading(false); }
  }, [driverName]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (item) => {
    if (!confirm('Delete this deduction?')) return;
    try {
      await base44.entities.DriverDeduction.delete(item.id);
      setDeductions((p) => p.filter((d) => d.id !== item.id));
      toast({ title: 'Deduction deleted' });
    } catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  const totalMonthly = deductions.filter((d) => d.status === 'active').reduce((s, d) => s + (Number(d.monthly_deduction) || 0), 0);
  const totalRemaining = deductions.filter((d) => d.status === 'active').reduce((s, d) => s + (Number(d.remaining_balance) || 0), 0);

  return (
    <div className="glass-card rounded-2xl flex flex-col transition-all duration-200" style={{ borderLeft: '4px solid hsl(var(--destructive))' }}>
      {/* Header — fixed */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(var(--panel-accent-rgb),0.10)', border: '1px solid rgba(var(--panel-accent-rgb),0.25)' }}>
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Pending Deductions</h3>
            <p className="text-xs text-muted-foreground truncate">Company loans & advances</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => setQuickViewOpen(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Quick View">
            <Eye className="w-4 h-4" />
          </button>
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }} size="sm" className="grad-btn h-7 px-3 rounded-full text-[13px] font-medium border-0">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Body — fixed height, internal scroll */}
      <div className="h-[280px] flex flex-col min-h-0">
        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto thin-scroll min-h-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : deductions.length === 0 ? (
            <div className="py-4"><EmptyState icon={Wallet} title="No deductions recorded" /></div>
          ) : (
            <div className="divide-y divide-border">
              {deductions.map((d) => {
                const meta = TYPE_META[d.type] || TYPE_META.other;
                const st = STATUS_META[d.status] || STATUS_META.active;
                const Icon = meta.icon;
                return (
                  <div key={d.id} className="flex items-start gap-3 p-5 hover:bg-muted/20 transition-colors">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(var(--panel-accent-rgb),0.10)', border: '1px solid rgba(var(--panel-accent-rgb),0.20)' }}>
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{d.description || meta.label}</p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          <span className={st.text}>{st.label}</span>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Issued: {formatDate(d.issue_date)} · Deduct: {formatCurrency(d.monthly_deduction)}/month
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Remaining: <span className="text-foreground/80 font-medium">{formatCurrency(d.remaining_balance)}</span>
                        <span className="mx-1.5">|</span>
                        Months Left: <span className="text-foreground/80 font-medium">{d.months_left ?? 0}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(d.total_amount)}</span>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditItem(d); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => handleDelete(d)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary footer — fixed at bottom */}
        {deductions.length > 0 && (
          <div className="grid grid-cols-2 border-t border-border bg-muted/20 flex-shrink-0">
            <div className="p-4 border-r border-border">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Monthly Deduction</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(totalMonthly)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
            </div>
            <div className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Remaining Balance</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(totalRemaining)}</p>
            </div>
          </div>
        )}
      </div>

      <DriverDeductionFormSheet open={formOpen} onOpenChange={setFormOpen} driverName={driverName} editItem={editItem} onSaved={load} />

      <QuickViewModal
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        title="Pending Deductions — Quick View"
        icon={Wallet}
        accent="#ef4444"
        records={deductions}
        dateField="issue_date"
        filename={`driver-${driverName}-deductions`}
        columns={[
          { label: 'Description', key: 'description' },
          { label: 'Type', key: 'type' },
          { label: 'Status', key: 'status' },
          { label: 'Issue Date', key: 'issue_date' },
          { label: 'Monthly Deduction', key: 'monthly_deduction', numeric: true },
          { label: 'Remaining Balance', key: 'remaining_balance', numeric: true },
          { label: 'Months Left', key: 'months_left', numeric: true },
          { label: 'Total Amount', key: 'total_amount', numeric: true },
        ]}
        renderRow={(d) => {
          const meta = TYPE_META[d.type] || TYPE_META.other;
          const st = STATUS_META[d.status] || STATUS_META.active;
          const Icon = meta.icon;
          return (
            <div key={d.id} className="flex items-start gap-3 rounded-xl p-3 border" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.18)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
                <Icon className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">{d.description || meta.label}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    <span className={st.text}>{st.label}</span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Issued: {formatDate(d.issue_date)} · Deduct: {formatCurrency(d.monthly_deduction)}/month</p>
                <p className="text-xs text-muted-foreground mt-0.5">Remaining: <span className="text-foreground/80 font-medium">{formatCurrency(d.remaining_balance)}</span> | Months Left: <span className="text-foreground/80 font-medium">{d.months_left ?? 0}</span></p>
              </div>
              <span className="text-sm font-bold text-foreground tabular-nums flex-shrink-0">{formatCurrency(d.total_amount)}</span>
            </div>
          );
        }}
        summaryFooter={(filtered) => {
          const tm = filtered.filter((d) => d.status === 'active').reduce((s, d) => s + (Number(d.monthly_deduction) || 0), 0);
          const tr = filtered.filter((d) => d.status === 'active').reduce((s, d) => s + (Number(d.remaining_balance) || 0), 0);
          return (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Monthly Deduction</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(tm)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Remaining Balance</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(tr)}</p>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}