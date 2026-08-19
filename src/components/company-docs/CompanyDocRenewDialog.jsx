import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/formatters';
import { RefreshCw, Loader2, ArrowRight, History } from 'lucide-react';
import DatePicker from '@/components/common/DatePicker';

export default function CompanyDocRenewDialog({ doc, open, onOpenChange, onRenewed }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [newExpiry, setNewExpiry] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && doc) {
      setNewExpiry('');
      setNotes('');
    }
  }, [open, doc]);

  if (!doc) return null;

  const oldExpiry = doc.expiry_date;
  const today = new Date().toISOString().split('T')[0];

  const handleRenew = async () => {
    if (!newExpiry) {
      toast({ variant: 'destructive', title: 'New expiry date is required' });
      return;
    }
    setSaving(true);
    try {
      const history = doc.renewal_history || [];
      const updatedHistory = [
        ...history,
        {
          old_expiry: oldExpiry || '',
          new_expiry: newExpiry,
          renewed_date: today,
          notes: notes || '',
        },
      ];
      await base44.entities.CompanyDocument.update(doc.id, {
        expiry_date: newExpiry,
        issue_date: oldExpiry || doc.issue_date || today,
        renewal_history: updatedHistory,
      });
      toast({ title: 'Document renewed', description: `${doc.document_type} expiry updated to ${formatDate(newExpiry)}` });
      onRenewed?.();
      onOpenChange(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "bg-background/50 border-border backdrop-blur-sm";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Renew Document
          </DialogTitle>
        </DialogHeader>

        {/* Document info */}
        <div className="glass-card p-3 mb-4 space-y-1.5">
          <p className="text-sm font-medium text-foreground">{doc.document_type}</p>
          {doc.reference_number && (
            <p className="text-xs text-muted-foreground">{doc.reference_number} · {doc.issuing_authority || 'No authority'}</p>
          )}
        </div>

        {/* Old → New expiry */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1.5">Old Expiry</Label>
              <div className="glass-card px-3 py-2.5 rounded-lg">
                <p className="text-sm text-muted-foreground">{oldExpiry ? formatDate(oldExpiry) : '—'}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground mt-5" />
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1.5">New Expiry</Label>
              <DatePicker value={newExpiry} onChange={setNewExpiry} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Renewal Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. Renewed via DED online portal, receipt #12345" className={inputCls} />
          </div>
        </div>

        {/* Renewal history */}
        {(doc.renewal_history || []).length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Renewal History ({doc.renewal_history.length})</p>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto thin-scroll">
              {[...doc.renewal_history].reverse().map((r, i) => (
                <div key={i} className="glass-card px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{r.old_expiry ? formatDate(r.old_expiry) : '—'}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground font-medium">{r.new_expiry ? formatDate(r.new_expiry) : '—'}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{r.renewed_date ? formatDate(r.renewed_date) : ''}</span>
                  </div>
                  {r.notes && <p className="text-[10px] text-muted-foreground mt-1">{r.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-border">Cancel</Button>
          <Button onClick={handleRenew} disabled={saving || !newExpiry} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {saving ? 'Renewing...' : 'Confirm Renewal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}