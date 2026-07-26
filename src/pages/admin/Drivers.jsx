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
import { formatDate, getInitials } from '@/lib/formatters';
import ExportButtons from '@/components/common/ExportButtons';
import EntityHeroCard from '@/components/common/EntityHeroCard';
import DriverCard from '@/components/admin/DriverCard';
import ImageUpload from '@/components/common/ImageUpload';
import Salary from './Salary';
import { Plus, Search, User, Pencil, Trash2, Phone } from 'lucide-react';

export default function Drivers() {
  const { t } = useI18n();
  const [tab, setTab] = useState('drivers');
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setTab('drivers')} className={`sub-tab ${tab === 'drivers' ? 'sub-tab-active' : ''}`}>{t('drivers')}</button>
        <button onClick={() => setTab('salary')} className={`sub-tab ${tab === 'salary' ? 'sub-tab-active' : ''}`}>{t('salary')}</button>
      </div>
      {tab === 'drivers' ? <DriversTab /> : <Salary />}
    </div>
  );
}

function DriversTab() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = () => {setLoading(true);base44.entities.Driver.list('-created_date', 100).then(setItems).finally(() => setLoading(false));};
  useEffect(() => {load();}, []);

  // Auto-open the new-driver form when arriving via ?new=1 (Dashboard quick action)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('new') === '1') { setEditItem(null); setFormOpen(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = items.filter((d) => !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.phone?.includes(search));

  return (
    <div>
      <PageHeader title={t('drivers')} description={`${items.length} drivers`}
      action={<div className="flex items-center gap-2"><ExportButtons data={filtered} filename="drivers" title="Drivers" columns={[{ label: 'Name', key: 'name' }, { label: 'Phone', key: 'phone' }, { label: 'Email', key: 'email' }, { label: 'License #', key: 'license_number' }, { label: 'License Expiry', key: 'license_expiry' }, { label: 'Nationality', key: 'nationality' }, { label: 'Status', key: 'status' }, { label: 'Vehicle', key: 'assigned_vehicle' }, { label: 'Base Salary', key: 'base_salary' }]} /><Button onClick={() => {setEditItem(null);setFormOpen(true);}} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button></div>} />
      
      <EntityHeroCard icon={User} title={t('drivers')} total={items.length} accent="59,130,246"
        stats={[
          { label: 'Active', value: items.filter(d => d.status === 'active').length, color: '#34d399' },
          { label: 'On Leave', value: items.filter(d => d.status === 'on_leave').length, color: '#f59e0b' },
          { label: 'Inactive', value: items.filter(d => d.status === 'inactive').length, color: '#94a3b8' },
        ]}
      />

      <div className="relative mb-5"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" /></div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={User} title={t('no_data')} /> :
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DriverCard key={d.id} d={d} onOpen={() => navigate(`/admin/drivers/${d.id}`)} onEdit={() => { setEditItem(d); setFormOpen(true); }} onDelete={async () => { await base44.entities.Driver.delete(d.id); load(); }} />
          ))}
        </div>
      }

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Driver</SheetTitle></SheetHeader>
          <DriverForm editItem={editItem} onSave={async (data) => {if (editItem) await base44.entities.Driver.update(editItem.id, data);else await base44.entities.Driver.create(data);load();setFormOpen(false);}} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>);

}

function DriverForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', image_url: '', phone: '', email: '', license_number: '', license_expiry: '', nationality: '', status: 'active', assigned_vehicle: '', base_salary: '', join_date: '', visa_expiry: '', notes: '' });
  useEffect(() => {if (editItem) setForm({ ...form, ...editItem, base_salary: editItem.base_salary || '' });else setForm({ name: '', image_url: '', phone: '', email: '', license_number: '', license_expiry: '', nationality: '', status: 'active', assigned_vehicle: '', base_salary: '', join_date: '', visa_expiry: '', notes: '' });}, [editItem]);
  const update = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));
  const handle = async () => {setSaving(true);await onSave({ ...form, base_salary: Number(form.base_salary) || 0 });setSaving(false);};

  return (
    <div className="space-y-4">
      <ImageUpload value={form.image_url} onChange={(v) => update('image_url', v)} label="Driver Photo" shape="circle" />
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Name</Label><Input value={form.name} onChange={(e) => update('name', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Phone</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Email</Label><Input value={form.email} onChange={(e) => update('email', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">License #</Label><Input value={form.license_number} onChange={(e) => update('license_number', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">License Expiry</Label><Input type="date" value={form.license_expiry} onChange={(e) => update('license_expiry', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label><Select value={form.status} onValueChange={(v) => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['active', 'inactive', 'on_leave'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Salary</Label><Input type="number" value={form.base_salary} onChange={(e) => update('base_salary', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('vehicle')}</Label><Input value={form.assigned_vehicle} onChange={(e) => update('assigned_vehicle', e.target.value)} className="bg-background border-border" /></div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>);

}