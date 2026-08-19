import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
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
import { Plus, Wrench, Search, BarChart3, LayoutGrid, Pencil, Trash2, ChevronRight } from 'lucide-react';
import ExportButtons from '@/components/common/ExportButtons';
import ImageUpload from '@/components/common/ImageUpload';
import { useGlobalDate, inGlobalDateRange } from '@/lib/GlobalDateContext';
import MaintenanceAnalytics from '@/components/admin/MaintenanceAnalytics';
import { downloadMaintenancePDF } from '@/lib/maintenancePdf';
import { getCompanySettings } from '@/lib/companySettings';
import { Download } from 'lucide-react';
import MobileFAB from '@/components/mobile/MobileFAB';
import DatePicker from '@/components/common/DatePicker';
import { withRetry, safeAll } from '@/lib/safeRequest';

const TYPE_TONE = {
  oil_change: '#f97316', tire: '#1ED760', brake: '#ef4444', engine: '#a855f7',
  electrical: '#eab308', body: '#ec4899', inspection: '#14b8a6', other: '#94a3b8'
};
const TYPE_LABEL = (k) => (k || 'other').replace(/_/g, ' ');

export default function Services() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [presetPlate, setPresetPlate] = useState('');
  const [mode, setMode] = useState('analytics');
  const [search, setSearch] = useState('');
  const { dateFrom, dateTo } = useGlobalDate();

  const load = () => {setLoading(true);withRetry(() => base44.entities.ServiceRecord.list('-created_date', 200)).then(setRecords).finally(() => setLoading(false));};
  useEffect(() => {load();}, []);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('new') === '1') {setEditItem(null);setFormOpen(true);setMode('browse');}
    if (p.get('vehicle_plate')) setPresetPlate(p.get('vehicle_plate'));
  }, []);

  const filtered = records.filter((r) => inGlobalDateRange(r.date, dateFrom, dateTo));
  const searched = filtered.filter((r) => !search || r.vehicle_plate?.toLowerCase().includes(search.toLowerCase()) || (r.service_type || '').includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display hidden">Maintenance</h1>
          <p className="text-sm text-muted-foreground hidden">Service records & fleet upkeep</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button onClick={() => setMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
            <button onClick={() => setMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
          </div>
          <ExportButtons data={filtered} filename="service_records" title="Service Records" columns={[{ label: 'Date', key: 'date' }, { label: 'Vehicle', key: 'vehicle_plate' }, { label: 'Type', key: 'service_type' }, { label: 'Vendor', key: 'vendor_name' }, { label: 'Cost', key: 'cost' }, { label: 'Status', key: 'status' }]} />
          <Button onClick={() => {setEditItem(null);setFormOpen(true);}} className="h-10 hidden md:inline-flex"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>
        </div>
      </div>

      {mode === 'analytics' ?
      <MaintenanceAnalytics records={filtered} loading={loading} onBrowse={() => setMode('browse')} /> :

      <>
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" />
          </div>

          {loading ? <LoadingSpinner /> : searched.length === 0 ? <EmptyState icon={Wrench} title={t('no_data')} /> :
        <div className="space-y-2">
              {searched.map((r) =>
          <ServiceRow key={r.id} r={r} onEdit={() => {setEditItem(r);setFormOpen(true);}} onDelete={async () => {await base44.entities.ServiceRecord.delete(r.id);load();}} onPdf={async () => {const s = await getCompanySettings();await downloadMaintenancePDF(r, s);}} />
          )}
            </div>
        }
        </>
      }

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Maintenance</SheetTitle></SheetHeader>
          <ServiceForm editItem={editItem} presetPlate={presetPlate} onSave={async (data) => {if (editItem) await base44.entities.ServiceRecord.update(editItem.id, data);else await base44.entities.ServiceRecord.create(data);load();setFormOpen(false);}} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
      <MobileFAB icon={Plus} onClick={() => {setEditItem(null);setFormOpen(true);}} label="Add Maintenance" />
    </div>);

}

function ServiceRow({ r, onEdit, onDelete, onPdf }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const tone = TYPE_TONE[r.service_type] || '#94a3b8';
  return (
    <>
      <div className="row-card row-edge-glow flex items-center gap-3 cursor-pointer group" onClick={onEdit} style={{ ['--row-accent']: tone }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${tone}1a`, border: `1px solid ${tone}55` }}><Wrench className="w-4 h-4" style={{ color: tone }} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground capitalize truncate">{TYPE_LABEL(r.service_type)}</p>
          <p className="text-xs text-muted-foreground truncate">{r.vehicle_plate} · {r.vendor_name || '—'} · {formatDate(r.date)}</p>
        </div>
        <div className="text-right flex-shrink-0"><p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(r.cost)}</p><StatusBadge status={r.status} /></div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onPdf} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100" title="Download PDF"><Download className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={onEdit} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"><Pencil className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => setConfirmDel(true)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
      {confirmDel &&
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmDel(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-foreground mb-1">Delete record?</p>
            <p className="text-xs text-muted-foreground mb-5">This action cannot be undone.</p>
            <div className="flex gap-3"><Button variant="outline" onClick={() => setConfirmDel(false)} className="flex-1 border-border">Cancel</Button><Button onClick={() => {onDelete();setConfirmDel(false);}} className="flex-1 bg-destructive">Delete</Button></div>
          </div>
        </div>
      }
    </>);

}

function ServiceForm({ editItem, presetPlate, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vendors, setVendors] = useState([]);
  useEffect(() => {
    safeAll([
    () => base44.entities.Vehicle.list('-created_date', 200),
    () => base44.entities.Vendor.list('-created_date', 200)],
    1).then(([v, vd]) => {setVehicles(v || []);setVendors(vd || []);}).catch(() => {});
  }, []);
  const [form, setForm] = useState({ vehicle_plate: presetPlate || '', service_type: 'other', description: '', date: new Date().toISOString().split('T')[0], cost: '', vendor_name: '', status: 'completed', notes: '', maint_ref: '', attachment_url: '' });
  useEffect(() => {if (editItem) setForm({ ...form, ...editItem, cost: editItem.cost || '' });else setForm({ vehicle_plate: presetPlate || '', service_type: 'other', description: '', date: new Date().toISOString().split('T')[0], cost: '', vendor_name: '', status: 'completed', notes: '', maint_ref: '', attachment_url: '' });}, [editItem, presetPlate]);
  const update = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));
  const handle = async () => {setSaving(true);await onSave({ ...form, cost: Number(form.cost) || 0 });setSaving(false);};

  return (
    <div className="space-y-4">
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('vehicle')}</Label><Select value={form.vehicle_plate || ''} onValueChange={(v) => update('vehicle_plate', v)}><SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.filter((v) => v.status === 'active' || v.plate_number === form.vehicle_plate).map((v) => <SelectItem key={v.id} value={v.plate_number}>{v.plate_number}{v.make && v.model ? ` · ${v.make} ${v.model}` : ''}</SelectItem>)}</SelectContent></Select></div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Maint. Ref #</Label><Input value={form.maint_ref} onChange={(e) => update('maint_ref', e.target.value)} placeholder="Enter reference number" className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Type</Label><Select value={form.service_type} onValueChange={(v) => update('service_type', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['oil_change', 'tire', 'brake', 'engine', 'electrical', 'body', 'inspection', 'other'].map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label><Select value={form.status} onValueChange={(v) => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['scheduled', 'in_progress', 'completed'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('description')}</Label><Textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={2} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('date')}</Label><DatePicker value={form.date} onChange={(v) => update('date', v)} /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Cost</Label><Input type="number" value={form.cost} onChange={(e) => update('cost', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Vendor</Label><Input list="svc-vendors" value={form.vendor_name} onChange={(e) => update('vendor_name', e.target.value)} placeholder="Select or type vendor name" className="bg-background border-border" /><datalist id="svc-vendors">{vendors.map((v) => <option key={v.id} value={v.name}>{v.category}</option>)}</datalist></div>
      <ImageUpload value={form.attachment_url} onChange={(v) => update('attachment_url', v)} label="Vendor Receipt Attachment" />
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>);

}