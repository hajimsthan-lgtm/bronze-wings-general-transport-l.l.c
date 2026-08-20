import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, LayoutGrid, Search, Store, Plus } from 'lucide-react';
import VendorsAnalytics from '@/components/admin/VendorsAnalytics';
import VendorCard from '@/components/admin/VendorCard';
import MobileFAB from '@/components/mobile/MobileFAB';
import ResponsiveLoading from '@/components/mobile/ResponsiveLoading';
import DuplicateConfirmDialog from '@/components/common/DuplicateConfirmDialog';
import { useVendorsMode, setVendorsMode } from '@/lib/vendorsStore';

export default function VendorsPanel() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { mode } = useVendorsMode();
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Vendor.list('-created_date', 200).catch(() => []),
      base44.entities.VendorExpense.list('-created_date', 500).catch(() => []),
    ]).then(([v, e]) => { setItems((v || []).filter((x) => x.category !== 'service_provider')); setExpenses(e || []); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Listen for TopBar "Add New" event
  useEffect(() => {
    const onNew = () => { setEditItem(null); setFormOpen(true); };
    window.addEventListener('vendors:new', onNew);
    return () => window.removeEventListener('vendors:new', onNew);
  }, []);

  const spendMap = {};
  expenses.forEach((e) => { if (e.vendor_name) spendMap[e.vendor_name] = (spendMap[e.vendor_name] || 0) + (Number(e.amount) || 0); });

  const searched = items.filter((v) => !search || v.name?.toLowerCase().includes(search.toLowerCase()) || (v.category || '').includes(search.toLowerCase()));

  const handleEdit = (v) => { setEditItem(v || null); setFormOpen(true); };

  return (
    <div>
      {mode === 'analytics' ? (
        <VendorsAnalytics vendors={items} expenses={expenses} loading={loading} onAdd={() => { setEditItem(null); setFormOpen(true); }} onBrowse={() => setVendorsMode('browse')} />
      ) : (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors..." className="pl-9 search-2026 h-10" />
          </div>
          {loading ? (
            <ResponsiveLoading type="list" count={4} />
          ) : searched.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full empty-orb flex items-center justify-center mx-auto mb-4"><Store className="w-7 h-7 text-muted-foreground" /></div>
              <p className="text-sm text-muted-foreground">No vendors found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searched.map((v) => (
                <VendorCard key={v.id} v={v} spend={spendMap[v.name] || 0} onEdit={handleEdit} onDelete={async (vendor) => { await base44.entities.Vendor.delete(vendor.id); load(); }} />
              ))}
            </div>
          )}
        </>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Vendor</SheetTitle></SheetHeader>
          <VendorForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.Vendor.update(editItem.id, data); else await base44.entities.Vendor.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
      <MobileFAB icon={Plus} onClick={() => { setEditItem(null); setFormOpen(true); }} label="Add Vendor" />
    </div>
  );
}

function VendorForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [dupInfo, setDupInfo] = useState(null);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', trn: '', category: 'other', status: 'active', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem }); else setForm({ name: '', contact_person: '', email: '', phone: '', address: '', trn: '', category: 'other', status: 'active', notes: '' }); }, [editItem]);
  const update = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));

  const doSave = async () => { setSaving(true); await onSave(form); setSaving(false); };
  const handle = async () => {
    if (!editItem && form.name) {
      try {
        const existing = await base44.entities.Vendor.list('-created_date', 200);
        const match = (existing || []).find((v) => v.name?.toLowerCase().trim() === form.name.toLowerCase().trim());
        if (match) { setDupInfo({ matchLabel: form.name, pendingSave: doSave }); return; }
      } catch { /* ignore */ }
    }
    doSave();
  };

  return (
    <div className="space-y-4">
      <div><Label className="text-xs text-muted-foreground mb-1.5">Name</Label><Input value={form.name} onChange={(e) => update('name', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Category</Label>
          <Select value={form.category} onValueChange={(v) => update('category', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['fuel', 'maintenance', 'parts', 'insurance', 'other'].map((c) => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
          <Select value={form.status} onValueChange={(v) => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Email</Label><Input value={form.email} onChange={(e) => update('email', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Phone</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Address</Label><Input value={form.address} onChange={(e) => update('address', e.target.value)} className="bg-background border-border" /></div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">TRN</Label><Input value={form.trn} onChange={(e) => update('trn', e.target.value)} className="bg-background border-border" /></div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
      <DuplicateConfirmDialog
        open={!!dupInfo}
        entityType="vendor"
        matchLabel={dupInfo?.matchLabel || ''}
        onContinue={() => { const fn = dupInfo?.pendingSave; setDupInfo(null); if (fn) fn(); }}
        onCancel={() => setDupInfo(null)}
      />
    </div>
  );
}