import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, LayoutTemplate, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import DocumentTemplateEditor from '@/components/invoices/template-editor/DocumentTemplateEditor';

export default function CustomTemplateManager({ open, onClose, documentType = 'invoice' }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.CustomTemplate.filter({ document_type: documentType }, '-updated_date', 100).catch(() => []);
      setTemplates(list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open, documentType]);

  const handleNew = () => {
    setEditingId(null);
    setEditorOpen(true);
  };

  const handleEdit = (tpl) => {
    setEditingId(tpl.id);
    setEditorOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await base44.entities.CustomTemplate.delete(deleteTarget.id);
      toast({ title: 'Template deleted' });
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e.message });
    }
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingId(null);
    load();
  };

  const typeLabel = documentType === 'invoice' ? 'Invoice' : documentType === 'quotation' ? 'Quotation' : 'Agreement';

  return (
    <>
      <Dialog open={open && !editorOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b border-border/40 flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-primary" />
              Custom {typeLabel} Templates
            </DialogTitle>
            <Button size="sm" onClick={handleNew} className="lightning-btn h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Template
            </Button>
          </DialogHeader>

          <div className="p-5 max-h-[60vh] overflow-y-auto thin-scroll">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-full empty-orb flex items-center justify-center mb-3">
                  <LayoutTemplate className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No custom templates yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create a custom template to use alongside the default {typeLabel.toLowerCase()} format.</p>
                <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" />Create Template</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map(tpl => (
                  <div
                    key={tpl.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40 hover:border-primary/30 transition-colors group"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: tpl.template_config?.header?.accentColor || '#1a1a1a' }}
                    >
                      {tpl.name?.[0]?.toUpperCase() || 'T'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tpl.description || `Custom template — edited ${formatDate(tpl.updated_date)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(tpl)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(tpl)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DocumentTemplateEditor
        open={editorOpen}
        onClose={handleEditorClose}
        documentType={documentType}
        saveTarget="customTemplate"
        templateId={editingId}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}". Invoices already created with this template will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}