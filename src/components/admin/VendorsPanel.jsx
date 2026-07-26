import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VendorsAnalytics from '@/components/admin/VendorsAnalytics';

export default function VendorsPanel() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Vendor.list('-created_date', 200).catch(() => []),
      base44.entities.VendorExpense.list('-created_date', 500).catch(() => []),
    ]).then(([v, e]) => { setItems(v || []); setExpenses(e || []); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <VendorsAnalytics vendors={items} expenses={expenses} loading={loading} onAdd={() => { setEditItem(null); setFormOpen(true); }} />

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Vendor</SheetTitle></SheetHeader>
          <VendorForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.Vendor.update(editItem.id, data); else await base44.entities.Vendor.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function VendorForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', trn: '', category: 'other', status: 'active', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem }); else setForm({ name: '', contact_person: '', email: '', phone: '', address: '', trn: '', category: 'other', status: 'active', notes: '' }); }, [editItem]);
  const update = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));
  const handle = async () => { setSaving(true); await onSave(form); setSaving(false); };

  return (
    <div className="space-y-4">
      <div><Label className="text-xs text-muted-foreground mb-1.5">Name</Label><Input value={form.name} onChange={(e) => update('name', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Category</Label>
          <Select value={form.category} onValueChange={(v) => update('category', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['fuel', 'maintenance', 'parts', 'insurance', 'other'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
          <Select value={form.status} onValueChange={(v) => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Email</Label><Input value={form.email} onChange={(e) => update('email', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Phone</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>
  );
}