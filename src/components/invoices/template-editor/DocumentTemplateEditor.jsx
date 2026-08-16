import { useState, useEffect, useCallback, useRef } from 'react';
import { Undo2, Redo2, RotateCcw, X, Save, Loader2, Smartphone, Monitor } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getCompanySettings, saveCompanySettings } from '@/lib/companySettings';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DEFAULT_TEMPLATE, deepClone, mergeTemplate } from './defaultTemplate';
import TemplatePreview from './TemplatePreview';
import TemplateSidebar from './TemplateSidebar';

const DOC_CONFIG = {
  invoice: { title: 'Edit Invoice Template', entity: 'Invoice', numKey: 'invoice_number' },
  quotation: { title: 'Edit Quotation Template', entity: 'Quotation', numKey: 'quotation_number' },
  agreement: { title: 'Edit Agreement Template', entity: 'Agreement', numKey: 'agreement_number' },
};

export default function DocumentTemplateEditor({ open, onClose, documentType = 'invoice' }) {
  const { toast } = useToast();
  const cfg = DOC_CONFIG[documentType] || DOC_CONFIG.invoice;
  const [template, setTemplate] = useState(deepClone(DEFAULT_TEMPLATE));
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [doc, setDoc] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showRerender, setShowRerender] = useState(false);
  const skipHistory = useRef(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [settingsData, docs] = await Promise.all([
          getCompanySettings(),
          base44.entities[cfg.entity].list('-created_date', 5).catch(() => []),
        ]);
        if (cancelled) return;
        setSettings(settingsData);
        setDoc(docs?.[0] || null);
        const allConfigs = settingsData.template_config || {};
        setTemplate(mergeTemplate(allConfigs[documentType]));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, documentType]);

  const updateTemplate = useCallback((newTpl) => {
    setTemplate(prev => {
      if (!skipHistory.current) {
        setHistory(h => [...h, prev]);
        setFuture([]);
      }
      return newTpl;
    });
  }, []);

  const undo = () => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture(f => [template, ...f]);
      setTemplate(prev);
      return h.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture(f => {
      if (f.length === 0) return f;
      const next = f[0];
      setHistory(h => [...h, template]);
      setTemplate(next);
      return f.slice(1);
    });
  };

  const resetToDefault = () => {
    updateTemplate(deepClone(DEFAULT_TEMPLATE));
    setShowReset(false);
    toast({ title: 'Template reset to default' });
  };

  const handleColumnResize = (colKey, newWidth) => {
    skipHistory.current = true;
    const cols = template.table.columns.map(c => c.key === colKey ? { ...c, width: Math.round(newWidth) } : c);
    setTemplate(t => ({ ...t, table: { ...t.table, columns: cols } }));
    clearTimeout(window._colResizeTimer);
    window._colResizeTimer = setTimeout(() => { skipHistory.current = false; }, 500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const existing = await getCompanySettings();
      const allConfigs = existing.template_config || {};
      const updatedConfigs = { ...allConfigs, [documentType]: template };
      await saveCompanySettings({ template_config: updatedConfigs });
      toast({ title: 'Template saved', description: `New ${documentType}s will use this layout.` });
      onClose();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleRerenderExisting = async () => {
    setShowRerender(false);
    toast({ title: 'Re-render queued', description: `Existing ${documentType}s will use the new template on next PDF export.` });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/60 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-foreground">{cfg.title}</h2>
          {doc && <span className="text-xs text-muted-foreground hidden sm:inline">Previewing: {doc[cfg.numKey] || '—'}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={undo} disabled={history.length === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} disabled={future.length === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30" title="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button onClick={() => setShowReset(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Reset to Default">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => setIsMobile(m => !m)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isMobile ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`} title="Toggle Mobile Preview">
            {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || loading} className="lightning-btn h-8 text-xs">
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Save Template
          </Button>
        </div>
      </div>

      {/* Body: preview + sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 overflow-hidden min-h-0 p-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <TemplatePreview
              template={template}
              doc={doc}
              documentType={documentType}
              settings={settings}
              selectedSection={selectedSection}
              onSelectSection={setSelectedSection}
              onColumnResize={handleColumnResize}
              isMobile={isMobile}
            />
          )}
        </div>

        <div className="w-72 lg:w-80 flex-shrink-0 border-l border-border bg-card/40 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Template Controls</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Click a section on the preview to jump to its controls</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TemplateSidebar
              template={template}
              onChange={updateTemplate}
              selectedSection={selectedSection}
            />
          </div>
          <div className="px-3 py-2.5 border-t border-border">
            <button
              onClick={() => setShowRerender(true)}
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors w-full text-left"
            >
              Re-render existing {documentType}s with new template →
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={showReset} onOpenChange={setShowReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default?</AlertDialogTitle>
            <AlertDialogDescription>This will discard all your changes and restore the default template layout.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetToDefault}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRerender} onOpenChange={setShowRerender}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-render Existing {documentType === 'invoice' ? 'Invoices' : documentType === 'quotation' ? 'Quotations' : 'Agreements'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will apply the new template to all existing {documentType}s when they are next exported as PDF. Past {documentType}s remain unchanged until re-exported.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRerenderExisting}>Apply</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}