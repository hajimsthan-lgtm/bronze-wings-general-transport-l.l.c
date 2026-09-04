import React, { useState, useEffect } from 'react';
import { LayoutTemplate, FileText, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { DEFAULT_LAYOUT } from '@/lib/invoiceLayoutModel';

export default function LayoutSelectorModal({ open, onClose, onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    base44.entities.CustomTemplate.filter({ document_type: 'invoice_layout' }, '-updated_date', 50)
      .then((list) => setTemplates(list || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [open]);

  const handleSelect = (layout) => {
    setSelected(layout);
    setTimeout(() => {
      onSelect(layout);
      setSelected(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            Choose Invoice Layout
          </DialogTitle>
          <DialogDescription>Select a layout template for this invoice, or use the default arrangement.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {/* Default layout */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-3 p-4 rounded-xl glass-card-hover border border-border/50 hover:border-primary/40 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/15 border border-primary/30">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Default Layout</div>
                <div className="text-[11px] text-muted-foreground">Standard invoice arrangement</div>
              </div>
              {selected === null && <Check className="w-4 h-4 text-primary" />}
            </button>

            {/* Saved custom layouts */}
            {templates.length > 0 && (
              <div className="pt-2 pb-1 px-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Custom Layouts</div>
              </div>
            )}
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleSelect(tpl.template_config)}
                className="w-full flex items-center gap-3 p-4 rounded-xl glass-card-hover border border-border/50 hover:border-primary/40 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/15 border border-accent/30">
                  <LayoutTemplate className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{tpl.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {tpl.template_config?.blocks?.filter(b => b.enabled).length || 0} blocks
                  </div>
                </div>
                {selected === tpl.template_config && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}