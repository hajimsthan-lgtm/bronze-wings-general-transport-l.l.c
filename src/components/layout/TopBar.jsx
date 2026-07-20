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

export default function Bank() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => {const d = new Date();return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];});
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const load = () => {setLoading(true);base44.entities.BankTransaction.list('-date', 100).then(setTransactions).finally(() => setLoading(false));};
  useEffect(() => {load();}, []);

  const dateFiltered = transactions.filter((tx) => !tx.date || tx.date >= dateFrom && tx.date <= dateTo);
  const filtered = dateFiltered.filter((tx) => {
    if (filter !== 'all' && filter === 'credit' && tx.type !== 'credit') return false;
    if (filter !== 'all' && filter === 'debit' && tx.type !== 'debit') return false;
    if (filter === 'reconciled' && !tx.reconciled) return false;
    if (search) return tx.description?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const totalCredits = dateFiltered.filter((t) => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0);
  const totalDebits = dateFiltered.filter((t) => t.type === 'debit').reduce((s, t) => s + (t.amount || 0), 0);

  return null;



























































}

function BankForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', reference: '', type: 'debit', amount: '', category: '', bank_name: '', notes: '' });
  useEffect(() => {if (editItem) setForm({ ...form, ...editItem, amount: editItem.amount || '' });else setForm({ date: new Date().toISOString().split('T')[0], description: '', reference: '', type: 'debit', amount: '', category: '', bank_name: '', notes: '' });}, [editItem]);
  const update = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));
  const handle = async () => {setSaving(true);await onSave({ ...form, amount: Number(form.amount) || 0 });setSaving(false);};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Type</Label>
          <Select value={form.type} onValueChange={(v) => update('type', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="credit">{t('credit')}</SelectItem><SelectItem value="debit">{t('debit')}</SelectItem></SelectContent>
          </Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('amount')}</Label><Input type="number" value={form.amount} onChange={(e) => update('amount', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('description')}</Label><Input value={form.description} onChange={(e) => update('description', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('date')}</Label><Input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Reference</Label><Input value={form.reference} onChange={(e) => update('reference', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Bank</Label><Input value={form.bank_name} onChange={(e) => update('bank_name', e.target.value)} className="bg-background border-border" /></div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('notes')}</Label><Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} className="bg-background border-border" /></div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>);

}