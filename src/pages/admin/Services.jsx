import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Wrench } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';

export default function Services() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const load = () => { setLoading(true); base44.entities.ServiceRecord.list('-created_date', 100).then(setRecords).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const filtered = records.filter(r => !r.date || (r.date >= dateFrom && r.date <= dateTo));

  return (
    <div>
      <PageHeader title={t('services')} description={`${filtered.length} service records`}
        action={<Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Wrench} title={t('no_data')} /> : (
        <div className="space-y-2">
          {filtered.map(r => (
            <button key={r.id} onClick={() => { setEditItem(r); setFormOpen(true); }} className="w-full text-left glass-card-hover p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><Wrench className="w-4 h-4 text-amber-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground capitalize">{r.service_type?.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">{r.vehicle_plate} · {r.vendor_name || '—'} · {formatDate(r.date)}</p>
              </div>
              <div className="text-right flex-shrink-0"><p className="text-sm font-semibold text-foreground">{formatCurrency(r.cost)}</p><StatusBadge status={r.status} /></div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Service</SheetTitle></SheetHeader>
          <ServiceForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.ServiceRecord.update(editItem.id, data); else await base44.entities.ServiceRecord.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ServiceForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  useEffect(() => { base44.entities.Vehicle.list('-created_date', 200).then(setVehicles).catch(() => {}); }, []);
  const [form, setForm] = useState({ vehicle_plate: '', service_type: 'other', description: '', date: new Date().toISOString().split('T')[0], cost: '', vendor_name: '', status: 'completed', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem, cost: editItem.cost || '' }); else setForm({ vehicle_plate: '', service_type: 'other', description: '', date: new Date().toISOString().split('T')[0], cost: '', vendor_name: '', status: 'completed', notes: '' }); }, [editItem]);
  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const handle = async () => { setSaving(true); await onSave({ ...form, cost: Number(form.cost) || 0 }); setSaving(false); };

  return (
    <div className="space-y-4">
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('vehicle')}</Label><Input list="svc-vehicles" value={form.vehicle_plate} onChange={e => update('vehicle_plate', e.target.value)} className="bg-background border-border" /><datalist id="svc-vehicles">{vehicles.map(v => <option key={v.id} value={v.plate_number} />)}</datalist></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Type</Label><Select value={form.service_type} onValueChange={v => update('service_type', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['oil_change','tire','brake','engine','electrical','body','inspection','other'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label><Select value={form.status} onValueChange={v => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['scheduled','in_progress','completed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('description')}</Label><Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('date')}</Label><Input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Cost</Label><Input type="number" value={form.cost} onChange={e => update('cost', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Vendor</Label><Input value={form.vendor_name} onChange={e => update('vendor_name', e.target.value)} className="bg-background border-border" /></div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>
  );
}