import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, UserRound } from 'lucide-react';

export default function ContactPersonEditSheet({ open, onOpenChange, contact, onSave, onDelete }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', position: '' });

  useEffect(() => {
    if (open && contact) {
      setForm({ name: contact.name || '', email: contact.email || '', phone: contact.phone || '', department: contact.department || '', position: contact.position || '' });
    }
  }, [open, contact]);

  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserRound className="w-4 h-4 text-primary" />
            </div>
            <SheetTitle className="font-display text-foreground">Edit Contact Person</SheetTitle>
          </div>
        </SheetHeader>
        <div className="space-y-4">
          <div><Label className="text-xs text-muted-foreground mb-1.5">Contact Name</Label><Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-background border-border" /></div>
          <div><Label className="text-xs text-muted-foreground mb-1.5">Position</Label><Input value={form.position} onChange={e => update('position', e.target.value)} placeholder="e.g. Manager, Director" className="bg-background border-border" /></div>
          <div><Label className="text-xs text-muted-foreground mb-1.5">Department</Label><Input value={form.department} onChange={e => update('department', e.target.value)} placeholder="e.g. Finance, Logistics" className="bg-background border-border" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5">Email</Label><Input value={form.email} onChange={e => update('email', e.target.value)} className="bg-background border-border" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Phone</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} className="bg-background border-border" /></div>
          </div>
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/50">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove Person
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Remove Contact Person?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently remove {form.name} from this company. This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">{t('cancel')}</Button>
            <Button onClick={handleSave} disabled={saving || !form.name} className="bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}