import { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { Label } from '@/components/ui/label';
import { Loader2, Paperclip, X, FileText, Check, ChevronDown } from 'lucide-react';

const DEFAULT_TYPES = ['registration', 'insurance', 'license', 'permit', 'contract', 'invoice', 'other'];

function isImage(url) {
  return /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(url || '');
}
function isPdf(url) {
  return /\.(pdf)(\?|$)/i.test(url || '');
}

export default function DocumentAddDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onFile,
  onSave,
  saving,
  uploading,
  usedTypes = [],
  editDoc = null,
}) {
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef(null);

  // Merge default types with previously used custom types, dedup, case-insensitive
  const typeSuggestions = useMemo(() => {
    const merged = [...DEFAULT_TYPES];
    for (const t of usedTypes) {
      if (t && !merged.some((m) => m.toLowerCase() === t.toLowerCase())) merged.push(t);
    }
    // filter by current input
    const q = (form.type || '').trim().toLowerCase();
    if (!q) return merged;
    return merged.filter((t) => t.toLowerCase().includes(q));
  }, [usedTypes, form.type]);

  useEffect(() => {
    const onClick = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const previewUrl = form.file_url;
  const fileName = previewUrl ? decodeURIComponent(previewUrl.split('/').pop().split('?')[0]) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editDoc ? 'Edit Document' : 'Add Document'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Title */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Document title"
              className="bg-background border-border"
            />
          </div>

          {/* Type — writable combobox with suggestions */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Type</Label>
            <div className="relative" ref={typeRef}>
              <Input
                value={form.type}
                onChange={(e) => {
                  setForm((p) => ({ ...p, type: e.target.value }));
                  setTypeOpen(true);
                }}
                onFocus={() => setTypeOpen(true)}
                placeholder="Type or select a type"
                className="bg-background border-border pr-8"
              />
              <button
                type="button"
                onClick={() => setTypeOpen((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {typeOpen && typeSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-popover/95 backdrop-blur-xl shadow-2xl p-1.5 thin-scroll">
                  {typeSuggestions.map((tp) => {
                    const active = (form.type || '').toLowerCase() === tp.toLowerCase();
                    return (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, type: tp }));
                          setTypeOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                          active ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className="capitalize">{tp}</span>
                        {active && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Free-text — suggestions from previously added types appear as you type.</p>
          </div>

          {/* Expiry */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Expiry Date</Label>
            <DatePicker
              value={form.expiry_date}
              onChange={(v) => setForm((p) => ({ ...p, expiry_date: v }))}
              className="bg-background border-border"
            />
          </div>

          {/* File upload + preview */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">File</Label>
            {!previewUrl ? (
              <label className="flex items-center justify-center gap-2 h-20 px-3 rounded-lg bg-background border border-dashed border-border cursor-pointer text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Paperclip className="w-4 h-4" /> Choose file to upload
                  </>
                )}
                <input type="file" className="hidden" onChange={onFile} disabled={uploading} />
              </label>
            ) : (
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                {/* Preview area */}
                <div className="relative h-40 bg-muted/20 flex items-center justify-center overflow-hidden">
                  {isImage(previewUrl) ? (
                    <img src={previewUrl} alt={fileName} className="h-full w-full object-contain" />
                  ) : isPdf(previewUrl) ? (
                    <iframe src={previewUrl} title={fileName} className="w-full h-full" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="w-10 h-10 opacity-50" />
                      <span className="text-xs truncate max-w-[80%]">{fileName}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, file_url: '' }))}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Filename bar */}
                <div className="px-3 py-2 text-xs text-muted-foreground truncate flex items-center gap-1.5 border-t border-border">
                  <Paperclip className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{fileName}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || uploading} className="bg-primary hover:bg-primary/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editDoc ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}