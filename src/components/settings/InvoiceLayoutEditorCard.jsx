import { useState, useEffect } from 'react';
import { LayoutTemplate, Eye, CalendarDays, Truck } from 'lucide-react';
import { getCompanySettings } from '@/lib/companySettings';
import InvoiceLayoutEditor from '@/components/invoices/layout-editor/InvoiceLayoutEditor';

export default function InvoiceLayoutEditorCard() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getCompanySettings().then(setSettings).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-primary" />
          Invoice Layout Editor
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize block arrangement, styling, column widths, and spacing for your invoice PDFs.
          Supports both Monthly and Per-Trip invoice formats with a live preview.
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-border/60 glass-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/15 text-violet-400 border border-violet-500/25">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">Block-Based Layout Editor</h3>
            <p className="text-sm text-muted-foreground">Drag to reorder blocks, toggle visibility, adjust column widths, and customize text styles.</p>
          </div>
          <button onClick={() => setOpen(true)} className="lightning-btn flex items-center gap-2">
            <Eye className="w-4 h-4" /> Open Editor
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
            <CalendarDays className="w-4 h-4 text-primary" />
            <div>
              <div className="text-sm font-medium text-foreground">Monthly Invoices</div>
              <div className="text-xs text-muted-foreground">Rental & contract billing</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
            <Truck className="w-4 h-4 text-primary" />
            <div>
              <div className="text-sm font-medium text-foreground">Per-Trip Invoices</div>
              <div className="text-xs text-muted-foreground">Individual trip billing</div>
            </div>
          </div>
        </div>
      </div>

      <InvoiceLayoutEditor
        open={open}
        onClose={() => setOpen(false)}
        settings={settings}
      />
    </div>
  );
}