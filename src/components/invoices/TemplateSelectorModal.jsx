import { useState, useEffect } from 'react';
import { FileText, LayoutTemplate, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/formatters';

export default function TemplateSelectorModal({ open, onClose, onSelect, documentType = 'invoice' }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // null = Default

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setLoading(true);
    base44.entities.CustomTemplate.filter({ document_type: documentType }, '-updated_date', 100)
      .catch(() => [])
      .then((list) => {
        setTemplates(list || []);
        setLoading(false);
      });
  }, [open, documentType]);

  const handleConfirm = () => {
    onSelect(selected); // null = Default, or template id
    onClose();
  };

  const typeLabel = documentType === 'invoice' ? 'Invoice' : documentType === 'quotation' ? 'Quotation' : 'Agreement';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-primary" />
            Choose {typeLabel} Template
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select a template for this {typeLabel.toLowerCase()}. The default format is the standard fixed layout.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-3 max-h-[50vh] overflow-y-auto thin-scroll space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Default option */}
              <button
                onClick={() => setSelected(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selected === null
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                    : 'border-border/40 bg-muted/20 hover:border-primary/30'
                }`}
              >
                <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-primary/15 border border-primary/30">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Default {typeLabel}</p>
                  <p className="text-xs text-muted-foreground">Standard fixed layout — the existing format</p>
                </div>
                {selected === null && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>

              {/* Custom templates */}
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setSelected(tpl.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    selected === tpl.id
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border/40 bg-muted/20 hover:border-primary/30'
                  }`}
                >
                  <div
                    className="tpl-badge w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: tpl.template_config?.header?.accentColor || '#1a1a1a' }}
                  >
                    {tpl.name?.[0]?.toUpperCase() || 'T'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tpl.description || `Custom — edited ${formatDate(tpl.updated_date)}`}
                    </p>
                  </div>
                  {selected === tpl.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              ))}
            </>
          )}
        </div>

        <DialogFooter className="px-5 py-4 border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-9">Cancel</Button>
          <Button size="sm" onClick={handleConfirm} disabled={loading} className="lightning-btn h-9">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}