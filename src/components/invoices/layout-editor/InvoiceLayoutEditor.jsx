import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Save, RotateCcw, Trash2, Loader2, AlertTriangle, CheckCircle2, X, Eye, Undo2, Redo2, Copy, CalendarDays, Truck, Printer, CloudUpload, Wand2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import LayoutBlockCard from './LayoutBlockCard';
import LayoutPreview from './LayoutPreview';
import {
  DEFAULT_LAYOUT, validateLayout, serializeLayout, deserializeLayout, BLOCK_META,
  moveBlock, resetBlockStyle, applyStyleToAll, getDefaultColumns,
  smartRestyleFields, applyPreset, resetBlockFields,
  BILLTO_PRESETS, SIGNATURE_PRESETS, DEFAULT_SIG_SPACING,
} from '@/lib/invoiceLayoutModel';
import { generateLayoutPreviewUrl } from '@/lib/invoiceLayoutRenderer';

const SAMPLE_TRIP = {
  invoice_number: '2026-PREVIEW',
  client_name: 'Emirates Filaments Factory - Sole Proprietorship L.L.C',
  contact_person: 'John Doe',
  client_address: 'Dubai Industrial City, Dubai, UAE',
  client_trn: '100-123-456-789',
  issue_date: '2026-09-04',
  due_date: '2026-10-04',
  lpo_ref: 'LPO-2026-001',
  vat_rate: 5,
  line_items: [
    { description: 'Dubai To Umm Al Quwain', date: '2026-09-01', quantity: 1, unit_price: 500, amount: 500, driver_name: 'Waheed', vehicle_no: '1/89125', delivery_note_no: '154215' },
    { description: 'Sharjah To Abu Dhabi', date: '2026-09-02', quantity: 1, unit_price: 600, amount: 600, driver_name: 'Ali', vehicle_no: '2/89126', delivery_note_no: '154216' },
    { description: 'Al Ain To Ras Al Khaimah', date: '2026-09-03', quantity: 1, unit_price: 750, amount: 750, driver_name: 'Saeed', vehicle_no: '3/89127', delivery_note_no: '154217' },
  ],
};

const SAMPLE_MONTHLY = {
  invoice_number: '2026-PREVIEW',
  client_name: 'Emirates Filaments Factory - Sole Proprietorship L.L.C',
  contact_person: 'John Doe',
  client_address: 'Dubai Industrial City, Dubai, UAE',
  client_trn: '100-123-456-789',
  issue_date: '2026-09-04',
  due_date: '2026-10-04',
  lpo_ref: 'LPO-2026-001',
  vat_rate: 5,
  line_items: [
    { description: 'Truck Rental — September 2026', date: '2026-09-01', quantity: 30, unit_price: 150, amount: 4500 },
    { description: 'Truck Rental — October 2026', date: '2026-10-01', quantity: 31, unit_price: 150, amount: 4650 },
    { description: 'Additional Trips (5)', date: '2026-09-15', quantity: 5, unit_price: 500, amount: 2500 },
  ],
};

export default function InvoiceLayoutEditor({ open, onClose, invoice, clientName, settings, invoiceType: initialType = 'monthly' }) {
  const { toast } = useToast();
  const [layout, setLayoutRaw] = useState(DEFAULT_LAYOUT);
  const [templates, setTemplates] = useState([]);
  const [layoutName, setLayoutName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewPageCount, setPreviewPageCount] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedBlock, setExpandedBlock] = useState(null);
  const [invoiceType, setInvoiceType] = useState(initialType);
  const previewTimer = useRef(null);

  // ── Undo / Redo ──
  const historyRef = useRef([JSON.stringify(DEFAULT_LAYOUT)]);
  const histIdxRef = useRef(0);
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const setLayout = useCallback((newLayout) => {
    setLayoutRaw(newLayout);
    const ser = JSON.stringify(newLayout);
    const hist = historyRef.current;
    const idx = histIdxRef.current;
    if (idx >= 0 && hist[idx] === ser) return;
    hist.length = idx + 1;
    hist.push(ser);
    histIdxRef.current = hist.length - 1;
    forceUpdate();
  }, []);

  const undo = useCallback(() => {
    if (histIdxRef.current <= 0) return;
    histIdxRef.current -= 1;
    setLayoutRaw(JSON.parse(historyRef.current[histIdxRef.current]));
    forceUpdate();
  }, []);

  const redo = useCallback(() => {
    if (histIdxRef.current >= historyRef.current.length - 1) return;
    histIdxRef.current += 1;
    setLayoutRaw(JSON.parse(historyRef.current[histIdxRef.current]));
    forceUpdate();
  }, []);

  const canUndo = histIdxRef.current > 0;
  const canRedo = histIdxRef.current < historyRef.current.length - 1;

  const previewInvoice = invoice || (invoiceType === 'monthly' ? SAMPLE_MONTHLY : SAMPLE_TRIP);
  const previewClient = clientName || previewInvoice.client_name;

  // Switch invoice type: update table block columns to match the new type
  const handleTypeChange = (newType) => {
    if (newType === invoiceType) return;
    setInvoiceType(newType);
    setLayout({
      ...layout,
      blocks: layout.blocks.map(b => b.type === 'table'
        ? { ...b, columns: getDefaultColumns(newType) }
        : b),
    });
  };

  // ── Load templates ──
  const loadTemplates = useCallback(async () => {
    try {
      const list = await base44.entities.CustomTemplate.filter({ document_type: 'invoice_layout' }, '-updated_date', 50).catch(() => []);
      setTemplates(list || []);
    } catch { setTemplates([]); }
  }, []);

  useEffect(() => { if (open) loadTemplates(); }, [open, loadTemplates]);

  const validation = validateLayout(layout);

  // ── Debounced live preview ──
  useEffect(() => {
    if (!open || validation.errors.length > 0) { setPreviewUrl(''); setPreviewPageCount(1); return; }
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const result = await generateLayoutPreviewUrl(previewInvoice, previewClient, settings || {}, layout, invoiceType);
        setPreviewUrl(result.url);
        setPreviewPageCount(result.pageCount);
      } catch (e) { /* keep old preview on error */ }
      finally { setPreviewLoading(false); }
    }, 350);
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [layout, open, validation.errors.length, settings, invoiceType]);

  // ── Handlers ──
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newBlocks = Array.from(layout.blocks);
    const [moved] = newBlocks.splice(result.source.index, 1);
    newBlocks.splice(result.destination.index, 0, moved);
    setLayout({ ...layout, blocks: newBlocks });
  };

  const handleToggle = (blockId, enabled) => {
    setLayout({ ...layout, blocks: layout.blocks.map(b => b.id === blockId ? { ...b, enabled } : b) });
  };

  const handleMove = (blockId, direction) => {
    const index = layout.blocks.findIndex(b => b.id === blockId);
    if (index < 0) return;
    setLayout(moveBlock(layout, index, direction));
  };

  const handleConfigChange = (blockId, configType, updates) => {
    setLayout({
      ...layout,
      blocks: layout.blocks.map(b => {
        if (b.id !== blockId) return b;
        if (configType === 'columns') return { ...b, columns: updates };
        if (configType === 'fields') return { ...b, fields: updates };
        return { ...b, [configType]: { ...b[configType], ...updates } };
      }),
    });
  };

  const handleResetConfig = (blockId, configType) => {
    if (configType === 'style') {
      setLayout(resetBlockStyle(layout, blockId));
    } else if (configType === 'columns') {
      setLayout({ ...layout, blocks: layout.blocks.map(b => b.id === blockId ? { ...b, columns: getDefaultColumns(invoiceType) } : b) });
    } else if (configType === 'fields') {
      const block = layout.blocks.find(b => b.id === blockId);
      setLayout(resetBlockFields(layout, blockId, block?.type));
    } else if (configType === 'sigSpacing') {
      setLayout({ ...layout, blocks: layout.blocks.map(b => b.id === blockId ? { ...b, sigSpacing: { ...DEFAULT_SIG_SPACING } } : b) });
    }
  };

  const handleSmartRestyle = (blockId) => {
    setLayout(smartRestyleFields(layout, blockId));
    toast({ title: 'Smart restyle applied', description: 'Key fields emphasized automatically' });
  };

  const handleAutoFixOverlap = (blockId) => {
    setLayout({
      ...layout,
      blocks: layout.blocks.map(b => {
        if (b.id !== blockId) return b;
        const fixedFields = {};
        Object.entries(b.fields || {}).forEach(([key, f]) => {
          fixedFields[key] = { ...f, visible: true, fontSize: 1 };
        });
        return {
          ...b,
          fields: fixedFields,
          style: { ...b.style, lineHeight: 1.3 },
          spacing: { ...b.spacing, paddingTop: 0, paddingBottom: 0 },
        };
      }),
    });
    toast({ title: 'Overlap auto-fixed', description: 'Field sizes, spacing & line height adjusted' });
  };

  const handleCompactAll = () => {
    setLayout({
      ...layout,
      blocks: layout.blocks.map(b => ({
        ...b,
        spacing: { ...b.spacing, paddingTop: 0, paddingBottom: 0 },
      })),
    });
    toast({ title: 'Spacing compacted', description: 'All block padding reduced to minimum' });
  };

  const handleOptimizeAll = () => {
    let newLayout = layout;
    for (const b of newLayout.blocks) {
      if (b.type === 'billTo' || b.type === 'signature') {
        newLayout = smartRestyleFields(newLayout, b.id);
      }
    }
    setLayout(newLayout);
    toast({ title: 'All blocks optimized', description: 'Key fields emphasized automatically' });
  };

  const handleApplyPreset = (blockId, blockType, preset) => {
    setLayout(applyPreset(layout, blockId, blockType, preset));
    toast({ title: `${preset.name} preset applied`, description: `${blockType === 'billTo' ? 'Bill To' : 'Signature'} restyled` });
  };

  const handleApplyStyleToAll = (style) => {
    setLayout(applyStyleToAll(layout, style));
    toast({ title: 'Style applied', description: 'Style settings applied to all blocks' });
  };

  const handleReset = () => {
    setLayout({ ...DEFAULT_LAYOUT, blocks: DEFAULT_LAYOUT.blocks.map(b => ({
      ...b,
      style: { ...b.style },
      columns: b.type === 'table' ? getDefaultColumns(invoiceType) : b.columns?.map(c => ({ ...c })),
    })) });
    setLayoutName('');
    setExpandedBlock(null);
  };

  const handleLoadTemplate = (tpl) => {
    setLayout(deserializeLayout(tpl.template_config));
    setLayoutName(tpl.name);
    setExpandedBlock(null);
  };

  const handleDuplicate = () => {
    setLayoutName(layoutName ? `${layoutName} (Copy)` : 'Untitled Layout (Copy)');
    toast({ title: 'Layout duplicated', description: 'Modify and save with a new name' });
  };

  const handleDuplicateTemplate = (tpl) => {
    setLayout(deserializeLayout(tpl.template_config));
    setLayoutName(`${tpl.name} (Copy)`);
    setExpandedBlock(null);
    toast({ title: 'Layout duplicated', description: 'Modify and save with a new name' });
  };

  const handleSave = async () => {
    if (!layoutName.trim()) { toast({ variant: 'destructive', title: 'Name required', description: 'Enter a name for this layout template' }); return; }
    if (validation.errors.length > 0) { toast({ variant: 'destructive', title: 'Cannot save', description: 'Fix validation errors first' }); return; }
    setSaving(true);
    try {
      await base44.entities.CustomTemplate.create({ name: layoutName.trim(), document_type: 'invoice_layout', template_config: serializeLayout(layout) });
      toast({ title: 'Layout saved', description: `"${layoutName}" is now available for invoice generation` });
      setLayoutName('');
      loadTemplates();
    } catch (e) { toast({ variant: 'destructive', title: 'Save failed', description: e.message }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await base44.entities.CustomTemplate.delete(deleteTarget.id);
      toast({ title: 'Template deleted' });
      setDeleteTarget(null);
      loadTemplates();
    } catch (e) { toast({ variant: 'destructive', title: 'Delete failed', description: e.message }); }
  };

  // Save layout to this specific invoice record + download PDF
  const handleSaveAndPrint = async () => {
    if (validation.errors.length > 0) return;
    setSaving(true);
    try {
      if (invoice?.id) {
        await base44.entities.Invoice.update(invoice.id, { custom_layout: serializeLayout(layout) });
      }
      const { renderLayoutPDF } = await import('@/lib/invoiceLayoutRenderer');
      await renderLayoutPDF(previewInvoice, previewClient, settings || {}, layout, invoiceType);
      toast({ title: 'Layout saved & PDF downloaded', description: invoice?.invoice_number || 'Invoice' });
      onClose();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  // Save layout to invoice + upload PDF to Google Drive
  const [driveUploading, setDriveUploading] = useState(false);
  const handleSaveToDrive = async () => {
    if (validation.errors.length > 0) return;
    setDriveUploading(true);
    try {
      if (invoice?.id) {
        await base44.entities.Invoice.update(invoice.id, { custom_layout: serializeLayout(layout) });
      }
      const { buildLayoutInvoicePdf } = await import('@/lib/invoiceLayoutRenderer');
      const pdf = await buildLayoutInvoicePdf(previewInvoice, previewClient, settings || {}, layout, invoiceType);
      const blob = pdf.output('blob');
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      const res = await base44.functions.invoke('saveInvoiceToDrive', {
        invoiceNumber: invoice?.invoice_number || 'untitled',
        issueDate: invoice?.issue_date || previewInvoice.issue_date,
        clientName: previewClient,
        pdfBase64: base64,
        fileName: `Invoice-${invoice?.invoice_number || 'untitled'}.pdf`,
      });
      toast({ title: 'Saved to Google Drive', description: `${invoice?.invoice_number || 'Invoice'} → ${res?.data?.folder || ''} folder` });
      onClose();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Drive save failed', description: e.message });
    } finally {
      setDriveUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[1700px] w-[96vw] max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b border-border/50 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-4">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Eye className="w-5 h-5 text-primary" />
                Invoice Layout Editor
              </DialogTitle>
              {/* Invoice type toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border/40">
                <button
                  onClick={() => handleTypeChange('monthly')}
                  className={cn('px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5',
                    invoiceType === 'monthly'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground')}
                >
                  <CalendarDays className="w-3.5 h-3.5" /> Monthly
                </button>
                <button
                  onClick={() => handleTypeChange('trip')}
                  className={cn('px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5',
                    invoiceType === 'trip'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground')}
                >
                  <Truck className="w-3.5 h-3.5" /> Per Trip
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} className="h-8 gap-1.5" title="Undo">
                <Undo2 className="w-4 h-4" /> Undo
              </Button>
              <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} className="h-8 gap-1.5" title="Redo">
                <Redo2 className="w-4 h-4" /> Redo
              </Button>
              <div className="w-px h-5 bg-border/50 mx-1" />
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
            {/* Left: Block list + templates */}
            <div className="lg:w-[360px] flex-shrink-0 border-r border-border/50 overflow-y-auto p-4 space-y-4">
              {/* Validation */}
              {validation.errors.length > 0 ? (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">{validation.errors.map((err, i) => <div key={i}>{err}</div>)}</div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-xs text-green-400">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Layout is valid — all constraints satisfied
                </div>
              )}

              {/* Block list */}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Invoice Blocks</div>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="blocks">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                        {layout.blocks.map((block, index) => (
                          <Draggable key={block.id} draggableId={block.id} index={index}>
                            {(prov) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} style={{ ...prov.draggableProps.style, opacity: 1 }}>
                                <LayoutBlockCard
                                  block={block}
                                  index={index}
                                  layout={layout}
                                  dragHandleProps={prov.dragHandleProps}
                                  onToggle={handleToggle}
                                  onMove={handleMove}
                                  onConfigChange={handleConfigChange}
                                  onResetConfig={handleResetConfig}
                                  onApplyStyleToAll={handleApplyStyleToAll}
                                  onSmartRestyle={handleSmartRestyle}
                                  onApplyPreset={handleApplyPreset}
                                  onAutoFixOverlap={handleAutoFixOverlap}
                                  isExpanded={expandedBlock === block.id}
                                  onExpand={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              {/* Quick Tools */}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Quick Tools</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button variant="outline" size="sm" onClick={handleOptimizeAll} className="h-8 text-xs gap-1.5" title="Apply smart restyle to all blocks">
                    <Sparkles className="w-3.5 h-3.5" /> Optimize All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCompactAll} className="h-8 text-xs gap-1.5" title="Reduce all block padding to zero">
                    <Wand2 className="w-3.5 h-3.5" /> Compact
                  </Button>
                </div>
              </div>

              {/* Saved templates */}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center justify-between">
                  <span>Saved Layouts</span>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="h-6 text-[10px] gap-1">
                    <RotateCcw className="w-3 h-3" /> Reset
                  </Button>
                </div>
                {templates.length === 0 ? (
                  <div className="text-xs text-muted-foreground/60 p-3 text-center border border-dashed border-border/40 rounded-xl">
                    No saved layouts yet. Arrange blocks above and save.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {templates.map((tpl) => (
                      <div key={tpl.id} className="flex items-center gap-2 p-2.5 rounded-xl glass-card-hover border border-border/40 hover:border-primary/40 transition-all group cursor-pointer" onClick={() => handleLoadTemplate(tpl)}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{tpl.name}</div>
                          <div className="text-[10px] text-muted-foreground">{tpl.template_config?.blocks?.filter(b => b.enabled).length || 0} blocks</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDuplicateTemplate(tpl); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-primary/15 text-primary" title="Duplicate">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(tpl); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/15 text-red-400" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Live preview */}
            <LayoutPreview
              previewUrl={previewUrl}
              previewLoading={previewLoading}
              pageCount={previewPageCount}
              validationErrors={validation.errors}
            />
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-border/50 gap-2">
            <Input placeholder="Layout template name..." value={layoutName} onChange={(e) => setLayoutName(e.target.value)} className="flex-1 max-w-xs" />
            <Button variant="outline" onClick={handleDuplicate} className="gap-2">
              <Copy className="w-4 h-4" /> Duplicate
            </Button>
            {invoice?.id && (
              <Button onClick={handleSaveAndPrint} disabled={saving || driveUploading || validation.errors.length > 0} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                Save & Print
              </Button>
            )}
            {invoice?.id && (
              <Button onClick={handleSaveToDrive} disabled={saving || driveUploading || validation.errors.length > 0} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                {driveUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                Save to Drive
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || validation.errors.length > 0 || !layoutName.trim()} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete layout "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The layout template will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}