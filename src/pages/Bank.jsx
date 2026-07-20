import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Search, Landmark, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import SatinCard from '@/components/common/SatinCard';

export default function Bank() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const load = () => { setLoading(true); base44.entities.BankTransaction.list('-date', 100).then(setTransactions).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const dateFiltered = transactions.filter(tx => !tx.date || (tx.date >= dateFrom && tx.date <= dateTo));
  const filtered = dateFiltered.filter(tx => {
    if (filter !== 'all' && filter === 'credit' && tx.type !== 'credit') return false;
    if (filter !== 'all' && filter === 'debit' && tx.type !== 'debit') return false;
    if (filter === 'reconciled' && !tx.reconciled) return false;
    if (search) return tx.description?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const totalCredits = dateFiltered.filter(t => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0);
  const totalDebits = dateFiltered.filter(t => t.type === 'debit').reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div>
      <PageHeader title={t('bank')} description="Bank transactions & reconciliation"
        action={<Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <SatinCard className="p-3"><p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#8a8a8a' }}>{t('credit')}</p><p className="text-lg font-bold mt-0.5" style={{ color: '#34d399', fontFamily: 'Georgia, "Times New Roman", serif' }}>{formatCurrency(totalCredits)}</p></SatinCard>
        <SatinCard className="p-3"><p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#8a8a8a' }}>{t('debit')}</p><p className="text-lg font-bold mt-0.5" style={{ color: '#f87171', fontFamily: 'Georgia, "Times New Roman", serif' }}>{formatCurrency(totalDebits)}</p></SatinCard>
        <SatinCard className="p-3 col-span-2 md:col-span-1"><p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#8a8a8a' }}>Net</p><p className="text-lg font-bold mt-0.5" style={{ color: '#f4f4f4', fontFamily: 'Georgia, "Times New Roman", serif' }}>{formatCurrency(totalCredits - totalDebits)}</p></SatinCard>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      <div className="space-y-3 mb-5">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 bg-card border-border h-10" /></div>
        <div className="flex gap-1.5">
          {['all', 'credit', 'debit', 'reconciled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-primary/15 text-primary border border-primary/20' : 'bg-muted/50 text-muted-foreground border border-transparent'}`}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Landmark} title={t('no_data')} /> : (
        <div className="space-y-2">
          {filtered.map(tx => (
            <button key={tx.id} onClick={() => { setEditItem(tx); setFormOpen(true); }} className="w-full text-left glass-card-hover p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {tx.type === 'credit' ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tx.description || '—'}</p>
                <p className="text-xs text-muted-foreground">{tx.reference || '—'} · {formatDate(tx.date)}</p>
              </div>
              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <span className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>{tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                {tx.reconciled && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Transaction</SheetTitle></SheetHeader>
          <BankForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.BankTransaction.update(editItem.id, data); else await base44.entities.BankTransaction.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function BankForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', reference: '', type: 'debit', amount: '', category: '', bank_name: '', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem, amount: editItem.amount || '' }); else setForm({ date: new Date().toISOString().split('T')[0], description: '', reference: '', type: 'debit', amount: '', category: '', bank_name: '', notes: '' }); }, [editItem]);
  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const handle = async () => { setSaving(true); await onSave({ ...form, amount: Number(form.amount) || 0 }); setSaving(false); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Type</Label>
          <Select value={form.type} onValueChange={v => update('type', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="credit">{t('credit')}</SelectItem><SelectItem value="debit">{t('debit')}</SelectItem></SelectContent>
          </Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('amount')}</Label><Input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('description')}</Label><Input value={form.description} onChange={e => update('description', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('date')}</Label><Input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Reference</Label><Input value={form.reference} onChange={e => update('reference', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Bank</Label><Input value={form.bank_name} onChange={e => update('bank_name', e.target.value)} className="bg-background border-border" /></div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('notes')}</Label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} className="bg-background border-border" /></div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>
  );
}