import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FREQUENCIES = ['one_time', 'monthly', 'quarterly', 'yearly'];
const DEFAULT = { description: '', amount: '', frequency: 'one_time', start_date: '', status: 'active', notes: '' };

export default function FixedChargeFormSheet({ open, onOpenChange, editItem, clientName, onSaved }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT });

  useEffect(() => {
    if (open) {
      if (editItem) setForm({ ...DEFAULT, ...editItem, amount: editItem.amount || '' });
      else setForm({ ...DEFAULT });
    }
  }, [editItem, open]);

  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, client_name: clientName, amount: Number(form.amount) || 0 };
      if (editItem) await base44.entities.FixedCharge.update(editItem.id, data);
      else await base44.entities.FixedCharge.create(data);
      onSaved?.(); onOpenChange(false);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/80 backdrop-blur-2xl border border-white/[0.08] max-w-md p-6 rounded-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-foreground text-lg">{editItem ? t('edit') : t('add_fixed_charge')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">{t('description')}</Label>
            <Input value={form.description} onChange={e => update('description', e.target.value)} placeholder="Dubai → Abu Dhabi" className="bg-background/50 border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">{t('amount')}</Label>
              <Input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} className="bg-background/50 border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">{t('frequency')}</Label>
              <Select value={form.frequency} onValueChange={v => update('frequency', v)}>
                <SelectTrigger className="bg-background/50 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">{t('start_date')}</Label>
              <Input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} className="bg-background/50 border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger className="bg-background/50 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-border">{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}