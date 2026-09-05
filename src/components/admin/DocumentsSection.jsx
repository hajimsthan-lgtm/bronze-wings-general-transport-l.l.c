import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';

import { FileText, Plus, Trash2, Download, Eye, Loader2, ChevronDown, Pencil, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import EmptyState from '@/components/common/EmptyState';
import { openDocument } from '@/lib/openDocument';
import { getDocStatus, getExpirySubtext, summarizeHealth, getHealthLevel, DOC_STATUS_VAR } from '@/lib/documentHealth';
import DocumentAddDialog from '@/components/admin/DocumentAddDialog';
import DocumentRenewDialog from '@/components/documents/DocumentRenewDialog';

const HEALTH_DOT_STYLE = {
  expired: { background: 'hsl(var(--danger))' },
  expiring_soon: { background: 'hsl(var(--warning))' },
  valid: { background: 'hsl(var(--success))' },
  empty: {},
};

export default function DocumentsSection({ entityType, entityId, accent = '#a855f7', defaultOpen = false, autoExpand = false, flashDocId = null }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(defaultOpen || autoExpand);
  const [adding, setAdding] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [renewingDoc, setRenewingDoc] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'other', expiry_date: '', file_url: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sectionRef = useState({ current: null })[0];

  const load = () => {
    setLoading(true);
    base44.entities.Document.filter({ related_entity: entityType, related_id: entityId })
      .then((rows) => setDocs(rows || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (entityId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  // Auto-expand: open the section and scroll it into view
  useEffect(() => {
    if (autoExpand && sectionRef.current) {
      setOpen(true);
      requestAnimationFrame(() => {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExpand, entityId]);

  const health = summarizeHealth(docs);
  const healthLevel = getHealthLevel(docs);

  // Collect previously used types for combobox suggestions
  const usedTypes = useMemo(() => {
    const set = new Set();
    docs.forEach((d) => { if (d.type) set.add(d.type); });
    return Array.from(set);
  }, [docs]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((p) => ({ ...p, file_url, title: p.title || file.name.replace(/\.[^.]+$/, '') }));
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title || !form.file_url) {
      toast({ title: 'Title and file are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingDoc) {
        await base44.entities.Document.update(editingDoc.id, {
          title: form.title,
          type: form.type,
          expiry_date: form.expiry_date || null,
          notes: form.notes,
          file_url: form.file_url,
          status: getDocStatus({ file_url: form.file_url, expiry_date: form.expiry_date }),
        });
        setEditingDoc(null);
        toast({ title: 'Document updated' });
      } else {
        await base44.entities.Document.create({
          title: form.title,
          type: form.type,
          related_entity: entityType,
          related_id: entityId,
          file_url: form.file_url,
          expiry_date: form.expiry_date || null,
          notes: form.notes,
          status: getDocStatus({ file_url: form.file_url, expiry_date: form.expiry_date }),
        });
        toast({ title: 'Document added' });
      }
      setForm({ title: '', type: 'other', expiry_date: '', file_url: '', notes: '' });
      setAdding(false);
      load();
    } catch {
      toast({ title: editingDoc ? 'Could not update document' : 'Could not add document', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const editDoc = (d) => {
    setEditingDoc(d);
    setForm({ title: d.title || '', type: d.type || 'other', expiry_date: d.expiry_date || '', file_url: d.file_url || '', notes: d.notes || '' });
    setAdding(true);
  };

  const downloadDoc = (d) => {
    if (!d.file_url) return;
    const a = document.createElement('a');
    a.href = d.file_url;
    a.download = d.title || 'document';
    a.target = '_blank';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const remove = async (d) => {
    try {
      await base44.entities.Document.delete(d.id);
      load();
    } catch {
      toast({ title: 'Could not delete', variant: 'destructive' });
    }
  };

  const isHex = accent.startsWith('#');
  const tileBg = isHex
    ? `linear-gradient(135deg, ${hexToRgba(accent, 0.14)}, ${hexToRgba(accent, 0.08)})`
    : 'rgba(255,255,255,0.05)';
  const tileBorder = isHex ? `1px solid ${hexToRgba(accent, 0.25)}` : '1px solid rgba(255,255,255,0.08)';
  const iconColor = isHex ? accent : 'hsl(var(--foreground))';

  const iconBtn =
    'inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors';

  return (
    <div
      ref={(el) => { sectionRef.current = el; }}
      className="glass-card rounded-2xl overflow-hidden transition-all duration-200 animate-fade-in-up"
      style={{ borderLeft: `4px solid ${accent}`, '--doc-accent': accent }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between p-4 border-b border-border gap-3 transition-colors duration-200 hover:bg-muted/30 cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: tileBg, border: tileBorder }}
          >
            <FileText className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{t('documents')}</h3>
            {/* Count badge — pill style matching TripChecklist */}
            <span className="text-[11px] font-bold text-foreground tabular-nums px-2 py-0.5 rounded-full bg-muted flex-shrink-0">
              {docs.length}
            </span>
            {/* Section-level health indicator — mirrors "2 unpaid" style */}
            {healthLevel !== 'empty' && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={HEALTH_DOT_STYLE[healthLevel]}
                title={
                  healthLevel === 'expired'
                    ? `${health.expired} expired`
                    : healthLevel === 'expiring_soon'
                      ? `${health.expiringSoon} expiring soon`
                      : 'All valid'
                }
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setAdding((v) => !v)} title={adding ? t('cancel') : t('add_new')} className={iconBtn}>
            <Plus className="w-3.5 h-3.5" />
          </button>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-[400ms] ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Content */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="p-4 space-y-3">
            {/* Add document dialog (popup in front) */}
            <DocumentAddDialog
              open={adding}
              onOpenChange={(v) => { if (!v) { setForm({ title: '', type: 'other', expiry_date: '', file_url: '', notes: '' }); setEditingDoc(null); } setAdding(v); }}
              form={form}
              setForm={setForm}
              onFile={onFile}
              onSave={save}
              saving={saving}
              uploading={uploading}
              usedTypes={usedTypes}
              editDoc={editingDoc}
            />

            {/* Document list */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : docs.length === 0 ? (
              <EmptyState icon={FileText} title={t('no_data')} />
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/30 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <div className="col-span-3">Title</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Expiry</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>
                {/* Rows */}
                <div className="divide-y divide-border">
                  {docs.map((d) => {
                    const st = getDocStatus(d);
                    const subtext = getExpirySubtext(d.expiry_date);
                    const isFlashing = flashDocId === d.id;
                    return (
                      <div
                        key={d.id}
                        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-muted/20 transition-colors ${isFlashing ? 'doc-row-flash' : ''}`}
                      >
                        {/* Title + status dot */}
                        <div className="col-span-3 flex items-center gap-2 text-foreground font-medium truncate min-w-0">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: `hsl(var(--${DOC_STATUS_VAR[st]}))` }}
                          />
                          <span className="truncate">{d.title}</span>
                        </div>
                        <div className="col-span-2 text-muted-foreground capitalize truncate">{d.type}</div>
                        {/* Expiry + relative subtext */}
                        <div className="col-span-2 min-w-0">
                          <div className="text-muted-foreground truncate">
                            {d.expiry_date ? formatDate(d.expiry_date) : '—'}
                          </div>
                          {subtext && (
                            <div
                              className="text-[10px] leading-tight"
                              style={{ color: `hsl(var(--${DOC_STATUS_VAR[subtext.tone]}))` }}
                            >
                              {subtext.text}
                            </div>
                          )}
                        </div>
                        <div
                          className="col-span-2 text-[11px] font-semibold uppercase truncate"
                          style={{ color: `hsl(var(--${DOC_STATUS_VAR[st]}))` }}
                        >
                          {st.replace('_', ' ')}
                        </div>
                        <div className="col-span-3 text-right flex items-center justify-end gap-0.5">
                          {d.file_url && (
                            <>
                              <button
                                onClick={() => openDocument(d.file_url, d.title)}
                                title="View"
                                className="text-muted-foreground hover:text-primary p-1.5"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => downloadDoc(d)}
                                title="Download"
                                className="text-muted-foreground hover:text-primary p-1.5"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => editDoc(d)}
                            title="Edit"
                            className="text-muted-foreground hover:text-primary p-1.5"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRenewingDoc(d)}
                            title="Renew"
                            className="text-muted-foreground hover:text-primary p-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => remove(d)}
                            title="Delete"
                            className="text-muted-foreground hover:text-red-400 p-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DocumentRenewDialog
        doc={renewingDoc}
        open={!!renewingDoc}
        onOpenChange={(v) => { if (!v) setRenewingDoc(null); }}
        onRenewed={load}
      />
    </div>
  );
}