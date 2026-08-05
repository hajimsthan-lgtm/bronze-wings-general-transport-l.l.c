import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PullToRefresh from '@/components/common/PullToRefresh';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import SatinCard from '@/components/common/SatinCard';

export default function Cash() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { dateFrom, dateTo, setDateFrom, setDateTo } = useGlobalDate();

  const load = () => { setLoading(true); base44.entities.CashTransaction.list('-date', 100).then(setTransactions).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const filtered = transactions.filter(tx => !tx.date || (tx.date >= dateFrom && tx.date <= dateTo));
  const inflows = filtered.filter(t => t.type === 'inflow').reduce((s, t) => s + (t.amount || 0), 0);
  const outflows = filtered.filter(t => t.type === 'outflow').reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <PullToRefresh onRefresh={load}>
    <div>
      <PageHeader title={t('cash')} description="Cash flow tracking"
        action={<Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>} />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <SatinCard className="p-3"><p className="eyebrow">{t('inflow')}</p><p className="text-lg font-bold mt-1 text-emerald-300 tabular-nums font-display">{formatCurrency(inflows)}</p></SatinCard>
        <SatinCard className="p-3"><p className="eyebrow">{t('outflow')}</p><p className="text-lg font-bold mt-1 text-rose-300 tabular-nums font-display">{formatCurrency(outflows)}</p></SatinCard>
        <SatinCard className="p-3"><p className="eyebrow">Balance</p><p className="text-lg font-bold mt-1 text-foreground tabular-nums font-display">{formatCurrency(inflows - outflows)}</p></SatinCard>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Wallet} title={t('no_data')} /> : (
        <div className="space-y-2">
          {filtered.map(tx => (
            <button key={tx.id} onClick={() => { setEditItem(tx); setFormOpen(true); }} className="w-full text-left glass-card-hover p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'inflow' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {tx.type === 'inflow' ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tx.description || '—'}</p>
                <p className="text-xs text-muted-foreground">{tx.type === 'inflow' ? tx.received_from : tx.paid_to} · {formatDate(tx.date)}</p>
              </div>
              <span className={`text-sm font-semibold ${tx.type === 'inflow' ? 'text-emerald-400' : 'text-red-400'}`}>{tx.type === 'inflow' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
            </button>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Cash Entry</SheetTitle></SheetHeader>
          <CashForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.CashTransaction.update(editItem.id, data); else await base44.entities.CashTransaction.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
    </PullToRefresh>
  );
}

function CashForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', type: 'outflow', amount: '', category: '', received_from: '', paid_to: '', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem, amount: editItem.amount || '' }); else setForm({ date: new Date().toISOString().split('T')[0], description: '', type: 'outflow', amount: '', category: '', received_from: '', paid_to: '', notes: '' }); }, [editItem]);
  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const handle = async () => { setSaving(true); await onSave({ ...form, amount: Number(form.amount) || 0 }); setSaving(false); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Type</Label>
          <Select value={form.type} onValueChange={v => update('type', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="inflow">{t('inflow')}</SelectItem><SelectItem value="outflow">{t('outflow')}</SelectItem></SelectContent>
          </Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('amount')}</Label><Input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('description')}</Label><Input value={form.description} onChange={e => update('description', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('date')}</Label><Input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{form.type === 'inflow' ? 'From' : 'Paid To'}</Label><Input value={form.type === 'inflow' ? form.received_from : form.paid_to} onChange={e => update(form.type === 'inflow' ? 'received_from' : 'paid_to', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('notes')}</Label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} className="bg-background border-border" /></div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>
  );
}