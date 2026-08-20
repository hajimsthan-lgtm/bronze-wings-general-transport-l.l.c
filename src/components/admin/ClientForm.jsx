import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, UserPlus, Users } from 'lucide-react';
import ImageUpload from '@/components/common/ImageUpload';
import DuplicateConfirmDialog from '@/components/common/DuplicateConfirmDialog';

export default function ClientForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [dupInfo, setDupInfo] = useState(null);
  const [existingClients, setExistingClients] = useState([]);
  const [selectedExistingId, setSelectedExistingId] = useState('');
  const [form, setForm] = useState({ name: '', image_url: '', contact_person: '', email: '', phone: '', address: '', trn: '', status: 'active', payment_terms: 'Net 30', notes: '' });
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', department: '', position: '' });

  useEffect(() => { base44.entities.Client.list('-created_date', 200).then(setExistingClients).catch(() => {}); }, []);

  useEffect(() => {
    if (editItem) { setForm({ ...editItem }); setSelectedExistingId(''); }
    else {
      setForm({ name: '', image_url: '', contact_person: '', email: '', phone: '', address: '', trn: '', status: 'active', payment_terms: 'Net 30', notes: '' });
      setSelectedExistingId('');
      setNewContact({ name: '', email: '', phone: '', department: '', position: '' });
    }
  }, [editItem]);

  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const updateContact = (f, v) => setNewContact(prev => ({ ...prev, [f]: v }));

  const selectedExisting = existingClients.find(c => c.id === selectedExistingId);
  const isAddContactMode = !editItem && !!selectedExistingId;

  const doSave = async () => {
    setSaving(true);
    try {
      if (isAddContactMode && selectedExisting) {
        const updated = { ...selectedExisting, contact_persons: [...(selectedExisting.contact_persons || []), newContact] };
        await onSave(updated, selectedExisting.id);
      } else {
        const data = { ...form };
        if (!editItem && form.contact_person) {
          data.contact_persons = [{ name: form.contact_person, email: form.email, phone: form.phone, department: '', position: '' }];
        }
        await onSave(data);
      }
    } finally { setSaving(false); }
  };

  const handle = async () => {
    // Only check duplicates on NEW company (not edit, not add-contact mode)
    if (!editItem && !isAddContactMode && form.name) {
      const match = existingClients.find((c) => c.name?.toLowerCase().trim() === form.name.toLowerCase().trim());
      if (match) { setDupInfo({ matchLabel: form.name, pendingSave: doSave }); return; }
    }
    doSave();
  };

  if (isAddContactMode) {
    const existingContacts = selectedExisting?.contact_persons || [];
    return (
      <div className="space-y-4">
        <div className="glass-card p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <p className="text-sm font-semibold text-foreground">{selectedExisting.name}</p>
          </div>
          {selectedExisting.trn && <p className="text-xs text-muted-foreground">TRN: {selectedExisting.trn}</p>}
          {selectedExisting.address && <p className="text-xs text-muted-foreground">{selectedExisting.address}</p>}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Change company</Label>
          <Select value={selectedExistingId} onValueChange={v => setSelectedExistingId(v === '__new__' ? '' : v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__new__">— New Company —</SelectItem>
              {existingClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-3.5 h-3.5 text-primary" />
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Add New Contact Person</p>
          </div>
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5">Contact Name *</Label><Input value={newContact.name} onChange={e => updateContact('name', e.target.value)} className="bg-background border-border" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Position</Label><Input value={newContact.position} onChange={e => updateContact('position', e.target.value)} placeholder="e.g. Manager, Director" className="bg-background border-border" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Department</Label><Input value={newContact.department} onChange={e => updateContact('department', e.target.value)} placeholder="e.g. Finance, Logistics" className="bg-background border-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground mb-1.5">Email</Label><Input value={newContact.email} onChange={e => updateContact('email', e.target.value)} className="bg-background border-border" /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5">Phone</Label><Input value={newContact.phone} onChange={e => updateContact('phone', e.target.value)} className="bg-background border-border" /></div>
            </div>
          </div>
        </div>

        {existingContacts.length > 0 && (
          <div className="border-t border-border/50 pt-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Existing Contacts ({existingContacts.length})</p>
            <div className="space-y-1.5">
              {existingContacts.map((cp, i) => (
                <div key={i} className="glass-card p-2 flex items-center justify-between">
                  <div><p className="text-xs font-medium text-foreground">{cp.name}</p>{cp.position && <p className="text-[10px] text-sky-300">{cp.position}</p>}{cp.department && <p className="text-[10px] text-primary">{cp.department}</p>}</div>
                  <p className="text-[10px] text-muted-foreground">{cp.email || cp.phone || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button>
          <Button onClick={handle} disabled={saving || !newContact.name} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : 'Add Contact'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ImageUpload value={form.image_url} onChange={(v) => update('image_url', v)} label="Company Logo / Photo" />
      {!editItem && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Select existing company (optional — to add another contact person)</Label>
          <Select value={selectedExistingId || '__none__'} onValueChange={v => setSelectedExistingId(v === '__none__' ? '' : v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue placeholder="— New Company —" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— New Company —</SelectItem>
              {existingClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div><Label className="text-xs text-muted-foreground mb-1.5">Company Name</Label><Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-background border-border" /></div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Contact Person</Label><Input value={form.contact_person} onChange={e => update('contact_person', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Email</Label><Input value={form.email} onChange={e => update('email', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Phone</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Address</Label><Textarea value={form.address} onChange={e => update('address', e.target.value)} rows={2} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">TRN</Label><Input value={form.trn} onChange={e => update('trn', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label><Select value={form.status} onValueChange={v => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
      </div>
      {editItem?.contact_persons?.length > 0 && (
        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-2"><Users className="w-3.5 h-3.5 text-primary" /><p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Contact Persons ({editItem.contact_persons.length})</p></div>
          <div className="space-y-1.5">
            {editItem.contact_persons.map((cp, i) => (
              <div key={i} className="glass-card p-2 flex items-center justify-between">
                <div><p className="text-xs font-medium text-foreground">{cp.name}</p>{cp.position && <p className="text-[10px] text-sky-300">{cp.position}</p>}{cp.department && <p className="text-[10px] text-primary">{cp.department}</p>}</div>
                <p className="text-[10px] text-muted-foreground">{cp.email || cp.phone || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving || (!editItem && !form.name)} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
      <DuplicateConfirmDialog
        open={!!dupInfo}
        entityType="client"
        matchLabel={dupInfo?.matchLabel || ''}
        onContinue={() => { const fn = dupInfo?.pendingSave; setDupInfo(null); if (fn) fn(); }}
        onCancel={() => setDupInfo(null)}
      />
    </div>
  );
}