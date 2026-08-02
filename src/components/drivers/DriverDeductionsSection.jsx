import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Home, Car, FileText, Wallet, Wrench, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import DriverDeductionFormSheet from './DriverDeductionFormSheet';

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
    <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ borderLeft: '4px solid hsl(var(--destructive))' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(var(--panel-accent-rgb),0.12)', border: '1px solid rgba(var(--panel-accent-rgb),0.25)' }}>
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Pending Deductions</h3>
            <p className="text-xs text-muted-foreground">Company loans & advances to be deducted monthly</p>
          </div>
        </div>
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 rounded-full">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Deduction
        </Button>
      </div>

      {/* List */}
      <div className="divide-y divide-border">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : deductions.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No deductions recorded</p>
          </div>
        ) : deductions.map((d) => {
          const meta = TYPE_META[d.type] || TYPE_META.other;
          const st = STATUS_META[d.status] || STATUS_META.active;
          const Icon = meta.icon;
          return (
            <div key={d.id} className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors">
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

      {/* Summary footer */}
      {deductions.length > 0 && (
        <div className="grid grid-cols-2 border-t border-border bg-muted/20">
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

      <DriverDeductionFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        driverName={driverName}
        editItem={editItem}
        onSaved={load}
      />
    </div>
  );
}