import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/formatters';
import ExportButtons from '@/components/common/ExportButtons';
import { Plus, Search, Truck, Pencil, Trash2 } from 'lucide-react';

export default function Vehicles() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = () => {setLoading(true);base44.entities.Vehicle.list('-created_date', 100).then(setItems).finally(() => setLoading(false));};
  useEffect(() => {load();}, []);

  const filtered = items.filter((v) => !search || v.plate_number?.toLowerCase().includes(search.toLowerCase()) || v.make?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={t('vehicles')} description={`${items.length} vehicles`}
      action={<div className="flex items-center gap-2"><ExportButtons data={filtered} filename="vehicles" title="Vehicles" columns={[{ label: 'Plate', key: 'plate_number' }, { label: 'Make', key: 'make' }, { label: 'Model', key: 'model' }, { label: 'Year', key: 'year' }, { label: 'Type', key: 'type' }, { label: 'Status', key: 'status' }, { label: 'Driver', key: 'assigned_driver' }, { label: 'Reg Expiry', key: 'registration_expiry' }, { label: 'Ins Expiry', key: 'insurance_expiry' }, { label: 'Fuel', key: 'fuel_type' }]} /><Button onClick={() => {setEditItem(null);setFormOpen(true);}} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button></div>} />
      
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 bg-card border-border h-10" />
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Truck} title={t('no_data')} /> :
      <div>
          {filtered.map((v) =>
        <div key={v.id} className="glass-card-hover p-4 cursor-pointer glow: 'hover:shadow-violet-400/30 color: 'from-violet-300/28 via-indigo-500/14 to-slate-950/30'," onClick={() => navigate(`/admin/vehicles/${v.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Truck className="w-4 h-4 text-primary" /></div>
                  <div><p className="text-sm font-semibold text-foreground">{v.plate_number}</p><p className="text-xs text-muted-foreground">{v.make} {v.model} {v.year}</p></div>
                </div>
                <StatusBadge status={v.status} />
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {v.assigned_driver && <p>Driver: <span className="text-foreground">{v.assigned_driver}</span></p>}
                {v.registration_expiry && <p>{t('registration')}: <span className="text-foreground">{formatDate(v.registration_expiry)}</span></p>}
                {v.insurance_expiry && <p>{t('insurance')}: <span className="text-foreground">{formatDate(v.insurance_expiry)}</span></p>}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => {setEditItem(v);setFormOpen(true);}} className="text-muted-foreground hover:text-foreground h-8 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-8 px-2"><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle className="text-foreground">{t('delete')} Vehicle?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={async () => {await base44.entities.Vehicle.delete(v.id);load();}} className="bg-destructive">{t('delete')}</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
        )}
        </div>
      }

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Vehicle</SheetTitle></SheetHeader>
          <VehicleForm editItem={editItem} onSave={async (data) => {if (editItem) await base44.entities.Vehicle.update(editItem.id, data);else await base44.entities.Vehicle.create(data);load();setFormOpen(false);}} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>);

}

function VehicleForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ plate_number: '', make: '', model: '', year: '', type: 'truck', status: 'active', assigned_driver: '', registration_expiry: '', insurance_expiry: '', fuel_type: 'diesel', notes: '' });
  useEffect(() => {if (editItem) setForm({ ...form, ...editItem, year: editItem.year || '' });else setForm({ plate_number: '', make: '', model: '', year: '', type: 'truck', status: 'active', assigned_driver: '', registration_expiry: '', insurance_expiry: '', fuel_type: 'diesel', notes: '' });}, [editItem]);
  const update = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));
  const handle = async () => {setSaving(true);await onSave({ ...form, year: form.year ? Number(form.year) : undefined });setSaving(false);};

  return (
    <div className="space-y-4">
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('plate_number')}</Label><Input value={form.plate_number} onChange={(e) => update('plate_number', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Make</Label><Input value={form.make} onChange={(e) => update('make', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Model</Label><Input value={form.model} onChange={(e) => update('model', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Year</Label><Input type="number" value={form.year} onChange={(e) => update('year', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Type</Label>
          <Select value={form.type} onValueChange={(v) => update('type', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['truck', 'trailer', 'tanker', 'pickup', 'other'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
          <Select value={form.status} onValueChange={(v) => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['active', 'maintenance', 'inactive'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('driver')}</Label><Input value={form.assigned_driver} onChange={(e) => update('assigned_driver', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Reg. Expiry</Label><Input type="date" value={form.registration_expiry} onChange={(e) => update('registration_expiry', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Ins. Expiry</Label><Input type="date" value={form.insurance_expiry} onChange={(e) => update('insurance_expiry', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>);

}