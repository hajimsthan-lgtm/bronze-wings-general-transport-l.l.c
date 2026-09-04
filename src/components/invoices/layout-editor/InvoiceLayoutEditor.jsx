import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Save, RotateCcw, Trash2, Loader2, AlertTriangle, CheckCircle2, X, Eye, Undo2, Redo2, Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LayoutBlockCard from './LayoutBlockCard';
import LayoutPreview from './LayoutPreview';
import {
  DEFAULT_LAYOUT, validateLayout, serializeLayout, deserializeLayout, BLOCK_META,
  moveBlock, resetBlockStyle, applyStyleToAll, DEFAULT_COLUMNS,
} from '@/lib/invoiceLayoutModel';
import { generateLayoutPreviewUrl } from '@/lib/invoiceLayoutRenderer';

const SAMPLE_INVOICE = {
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

export default function InvoiceLayoutEditor({ open, onClose, invoice, clientName, settings, invoiceType = 'monthly' }) {
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

  const previewInvoice = invoice || SAMPLE_INVOICE;
  const previewClient = clientName || previewInvoice.client_name;

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
      } catch (e) { setPreviewUrl(''); }
      finally { setPreviewLoading(false); }
    }, 800);
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
        return { ...b, [configType]: { ...b[configType], ...updates } };
      }),
    });
  };

  const handleResetConfig = (blockId, configType) => {
    if (configType === 'style') {
      setLayout(resetBlockStyle(layout, blockId));
    } else if (configType === 'columns') {
      setLayout({ ...layout, blocks: layout.blocks.map(b => b.id === blockId ? { ...b, columns: DEFAULT_COLUMNS.map(c => ({ ...c })) } : b) });
    }
  };

  const handleApplyStyleToAll = (style) => {
    setLayout(applyStyleToAll(layout, style));
    toast({ title: 'Style applied', description: 'Style settings applied to all blocks' });
  };

  const handleReset = () => {
    setLayout({ ...DEFAULT_LAYOUT, blocks: DEFAULT_LAYOUT.blocks.map(b => ({ ...b, style: { ...b.style }, columns: b.columns?.map(c => ({ ...c })) })) });
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

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[1400px] max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b border-border/50 flex-row items-center justify-between space-y-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5 text-primary" />
              Invoice Layout Editor
            </DialogTitle>
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
                          <Draggable key={block.id} draggableId={block.id} index={index} isDragDisabled={!BLOCK_META[block.type].canReorder}>
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