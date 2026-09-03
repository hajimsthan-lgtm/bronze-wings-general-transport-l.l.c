import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/formatters';
import { daysUntil } from '@/lib/alertEngine';
import { Plus, Search, FileText, Pencil, Trash2, Upload, ExternalLink, RefreshCw, History, Eye, Loader2, Car, ShieldCheck, IdCard, Truck, Receipt, CheckCircle2, CalendarClock, CalendarX, ArrowUpRight, Building2 } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ExportButtons from '@/components/common/ExportButtons';
import DocumentRenewDialog from '@/components/documents/DocumentRenewDialog';
import DocumentHistoryDialog from '@/components/documents/DocumentHistoryDialog';
import DocumentQuickView from '@/components/documents/DocumentQuickView';

const DOC_TYPES = [
  { value: 'registration', label: 'Registration' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'license', label: 'License' },
  { value: 'permit', label: 'Permit' },
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'other', label: 'Other' },
];

const TYPE_VISUALS = {
  registration: { icon: Car, color: '#3b82f6' },
  insurance: { icon: ShieldCheck, color: '#ef4444' },
  license: { icon: IdCard, color: '#a855f7' },
  permit: { icon: Truck, color: '#06b6d4' },
  contract: { icon: FileText, color: '#f59e0b' },
  invoice: { icon: Receipt, color: '#10b981' },
  other: { icon: FileText, color: '#6b7280' },
};

const DOC_CATEGORIES = [
  { key: 'all', label: 'All', redirect: null },
  { key: 'vehicle', label: 'Vehicle Docs', redirect: '/admin/vehicles' },
  { key: 'driver', label: 'Driver Docs', redirect: '/admin/drivers' },
  { key: 'client', label: 'Client Docs', redirect: '/admin/clients' },
  { key: 'vendor', label: 'Vendor Docs', redirect: '/admin/vendors' },
  { key: 'company', label: 'Company Docs', redirect: '/admin/company-documents' },
  { key: 'other', label: 'Other', redirect: null },
];

function getEntityCategory(doc) {
  const re = (doc.related_entity || '').toLowerCase().trim();
  if (re.includes('vehicle') || re.includes('plate') || re.includes('mulkiya')) return 'vehicle';
  if (re.includes('driver')) return 'driver';
  if (re.includes('client')) return 'client';
  if (re.includes('vendor')) return 'vendor';
  if (re.includes('company') || re.includes('bronze')) return 'company';
  const type = doc.type || '';
  if (type === 'registration' || type === 'permit' || type === 'insurance') return 'vehicle';
  if (type === 'license') return 'driver';
  if (type === 'invoice' || type === 'contract') return 'client';
  return 'other';
}

function docStatus(expiry, alertDays = 30) {
  const days = daysUntil(expiry);
  if (days === null) return 'valid';
  if (days < 0) return 'expired';
  if (days <= alertDays) return 'expiring_soon';
  return 'valid';
}

const STATUS_CONFIG = {
  valid: { label: 'Valid', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.35)' },
  expiring_soon: { label: 'Expiring Soon', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)' },
  expired: { label: 'Expired', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)' },
};

function StatusBadge({ expiry, alertDays = 30 }) {
  const status = docStatus(expiry, alertDays);
  const cfg = STATUS_CONFIG[status];
  const days = daysUntil(expiry);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
      {days !== null && days >= 0 && status === 'expiring_soon' && ` · ${days}d`}
      {days !== null && days < 0 && ` · ${Math.abs(days)}d ago`}
    </span>
  );
}

export default function Documents() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [entityNames, setEntityNames] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [renewDoc, setRenewDoc] = useState(null);
  const [quickViewDoc, setQuickViewDoc] = useState(null);
  const [historyDoc, setHistoryDoc] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    base44.entities.Document.list('-created_date', 200)
      .then(setItems)
      .catch(err => { setLoadError(err?.message || 'Failed to load documents'); setItems([]); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Resolve entity names for richer descriptions (plate numbers, driver names, etc.)
  useEffect(() => {
    const loadEntities = async () => {
      try {
        const [vehicles, drivers, clients, vendors] = await Promise.all([
          base44.entities.Vehicle.list().catch(() => []),
          base44.entities.Driver.list().catch(() => []),
          base44.entities.Client.list().catch(() => []),
          base44.entities.Vendor.list().catch(() => []),
        ]);
        const names = {};
        (vehicles || []).forEach(v => { names[`vehicle_${v.id}`] = v.plate_number || v.make || ''; });
        (drivers || []).forEach(d => { names[`driver_${d.id}`] = d.name || ''; });
        (clients || []).forEach(c => { names[`client_${c.id}`] = c.name || ''; });
        (vendors || []).forEach(v => { names[`vendor_${v.id}`] = v.name || ''; });
        setEntityNames(names);
      } catch {}
    };
    loadEntities();
  }, []);

  // Sort: expired first, then expiring soon, then valid, no-expiry last
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const aDays = daysUntil(a.expiry_date);
      const bDays = daysUntil(b.expiry_date);
      if (aDays === null && bDays === null) return 0;
      if (aDays === null) return 1;
      if (bDays === null) return -1;
      return aDays - bDays;
    });
  }, [items]);

  const filtered = sorted.filter(d => {
    const matchSearch = !search ||
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.issuing_authority?.toLowerCase().includes(search.toLowerCase()) ||
      d.related_entity?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || docStatus(d.expiry_date, d.alert_days || 30) === statusFilter;
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchCategory = categoryFilter === 'all' || getEntityCategory(d) === categoryFilter;
    return matchSearch && matchStatus && matchType && matchCategory;
  });

  const categoryCounts = useMemo(() => {
    const counts = { all: items.length };
    DOC_CATEGORIES.forEach(c => { if (c.key !== 'all') counts[c.key] = 0; });
    items.forEach(d => {
      const cat = getEntityCategory(d);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [items]);

  const stats = useMemo(() => ({
    total: items.length,
    valid: items.filter(d => docStatus(d.expiry_date, d.alert_days || 30) === 'valid').length,
    expiring: items.filter(d => docStatus(d.expiry_date, d.alert_days || 30) === 'expiring_soon').length,
    expired: items.filter(d => docStatus(d.expiry_date, d.alert_days || 30) === 'expired').length,
  }), [items]);

  return (
    <div>
      <PageHeader icon={FileText} title="Documents" description="Track document expiries, renewals & history" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <ReportStatCard index={1} label="Total Documents" value={stats.total} icon={FileText} color="#00f2c3" />
        <ReportStatCard index={2} label="Valid" value={stats.valid} icon={CheckCircle2} color="#22c55e" />
        <ReportStatCard index={3} label="Expiring Soon" value={stats.expiring} icon={CalendarClock} color="#f59e0b" />
        <ReportStatCard index={4} label="Expired" value={stats.expired} icon={CalendarX} color="#ef4444" />
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {DOC_CATEGORIES.map(cat => (
          <div key={cat.key} className="inline-flex items-center">
            <button
              onClick={() => setCategoryFilter(cat.key)}
              className={`sub-tab ${categoryFilter === cat.key ? 'sub-tab-active' : ''}`}
            >
              {cat.label}
              {categoryCounts[cat.key] > 0 && (
                <span className="ml-1.5 text-[10px] font-bold opacity-70">{categoryCounts[cat.key]}</span>
              )}
            </button>
            {cat.redirect && (
              <button
                onClick={() => navigate(cat.redirect)}
                className="ml-0.5 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title={`Go to ${cat.label}`}
              >
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="pl-9 search-2026 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 h-10 search-2026"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10 search-2026"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {DOC_TYPES.map(dt => <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <ExportButtons data={filtered} filename="documents" title="Documents" columns={[{ label: 'Title', key: 'title' }, { label: 'Type', key: 'type' }, { label: 'Reference #', key: 'reference_number' }, { label: 'Issuing Authority', key: 'issuing_authority' }, { label: 'Related To', key: 'related_entity' }, { label: 'Expiry', key: 'expiry_date' }]} />
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>
      </div>

      {/* Rate-limit / load error — friendly retry prompt */}
      {loadError && !loading && (
        <div className="glass-card p-6 rounded-xl flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)' }}>
            <RefreshCw className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Couldn't load documents</p>
            <p className="text-xs text-muted-foreground mt-1">{loadError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="mt-1">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
        </div>
      )}

      {/* List */}
      {loading ? <LoadingSpinner /> : loadError ? null : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={items.length === 0 ? "No documents" : "No matching documents"}
          description={items.length === 0 ? "Add your first document to start tracking expiries" : "Try adjusting your search or filters"}
        />
      ) : (
        <div className="space-y-2 pb-8">
          {filtered.map(doc => {
            const visuals = TYPE_VISUALS[doc.type] || TYPE_VISUALS.other;
            const DocIcon = visuals.icon;
            return (
              <div key={doc.id} className="row-card flex items-center gap-4 cursor-pointer" onClick={() => setQuickViewDoc(doc)}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${visuals.color}1a`, border: `1px solid ${visuals.color}40` }}>
                  <DocIcon className="w-4 h-4" style={{ color: visuals.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    <span className="capitalize">{doc.type?.replace(/_/g, ' ')}</span>
                    {doc.reference_number && ` · ${doc.reference_number}`}
                    {doc.issuing_authority && ` · ${doc.issuing_authority}`}
                    {doc.related_entity && ` · ${doc.related_entity}`}
                  </p>
                  {(() => {
                    const cat = getEntityCategory(doc);
                    const entityName = doc.related_id ? entityNames[`${cat}_${doc.related_id}`] : null;
                    const desc = entityName || (doc.related_entity && !['vehicle', 'driver', 'client', 'vendor', 'company'].includes(doc.related_entity.toLowerCase()) ? doc.related_entity : '');
                    if (!desc && !doc.notes) return null;
                    return (
                      <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 flex items-center gap-1">
                        {desc && <><span className="text-primary/80 font-medium">{desc}</span><span className="text-muted-foreground/30">·</span></>}
                        {doc.notes && <span className="truncate">{doc.notes}</span>}
                      </p>
                    );
                  })()}
                </div>
                <div className="hidden sm:block text-right flex-shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expiry</p>
                  <p className="text-xs font-medium text-foreground">{doc.expiry_date ? formatDate(doc.expiry_date) : '—'}</p>
                </div>
                <StatusBadge expiry={doc.expiry_date} alertDays={doc.alert_days || 30} />
                <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => setQuickViewDoc(doc)} className="text-muted-foreground hover:text-primary h-8 px-2" title="Quick view"><Eye className="w-3.5 h-3.5" /></Button>
                  {doc.expiry_date && (
                    <Button variant="ghost" size="sm" onClick={() => setRenewDoc(doc)} className="text-muted-foreground hover:text-amber-500 h-8 px-2" title="Renew"><RefreshCw className="w-3.5 h-3.5" /></Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setHistoryDoc(doc)} className="text-muted-foreground hover:text-primary h-8 px-2" title="History"><History className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditItem(doc); setFormOpen(true); }} className="text-muted-foreground h-8 px-2" title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-8 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Delete document?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => { await base44.entities.Document.delete(doc.id); load(); }} className="bg-destructive">{t('delete')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Document</DialogTitle>
          </DialogHeader>
          <DocForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.Document.update(editItem.id, data); else await base44.entities.Document.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Renew Dialog */}
      <DocumentRenewDialog doc={renewDoc} open={!!renewDoc} onOpenChange={(v) => { if (!v) setRenewDoc(null); }} onRenewed={load} />

      {/* Quick View */}
      <DocumentQuickView doc={quickViewDoc} open={!!quickViewDoc} onOpenChange={(v) => { if (!v) setQuickViewDoc(null); }} typeVisuals={quickViewDoc ? (TYPE_VISUALS[quickViewDoc.type] || TYPE_VISUALS.other) : null} />

      {/* History Dialog */}
      <DocumentHistoryDialog doc={historyDoc} open={!!historyDoc} onOpenChange={(v) => { if (!v) setHistoryDoc(null); }} />
    </div>
  );
}

function DocForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'other',
    reference_number: '',
    issuing_authority: '',
    related_entity: '',
    issue_date: '',
    expiry_date: '',
    alert_days: 30,
    file_url: '',
    notes: '',
  });

  useEffect(() => {
    if (editItem) setForm({ ...form, ...editItem, alert_days: editItem.alert_days || 30 });
    else setForm({ title: '', type: 'other', reference_number: '', issuing_authority: '', related_entity: '', issue_date: '', expiry_date: '', alert_days: 30, file_url: '', notes: '' });
  }, [editItem]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('file_url', file_url);
      toast({ title: 'File uploaded' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title?.trim()) {
      toast({ variant: 'destructive', title: 'Title is required' });
      return;
    }
    if (!form.type) {
      toast({ variant: 'destructive', title: 'Type is required' });
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      toast({ title: editItem ? 'Document updated' : 'Document created' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "bg-background/50 border-border backdrop-blur-sm";

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Title</Label>
        <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Vehicle Registration - Plate 12345" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Type</Label>
          <Select value={form.type} onValueChange={v => update('type', v)}>
            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOC_TYPES.map(dt => <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Reference #</Label>
          <Input value={form.reference_number} onChange={e => update('reference_number', e.target.value)} placeholder="e.g. REG-12345" className={inputCls} />
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Issuing Authority</Label>
        <Input value={form.issuing_authority} onChange={e => update('issuing_authority', e.target.value)} placeholder="e.g. RTA, DED, Insurance Co." className={inputCls} />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Related To</Label>
        <Input value={form.related_entity} onChange={e => update('related_entity', e.target.value)} placeholder="e.g. Vehicle plate, driver name, company" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Issue Date</Label>
          <DatePicker value={form.issue_date} onChange={v => update('issue_date', v)} className={inputCls} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Expiry Date</Label>
          <DatePicker value={form.expiry_date} onChange={v => update('expiry_date', v)} className={inputCls} />
        </div>
      </div>
      {form.expiry_date && (
        <div className="glass-card p-2.5 flex items-center gap-2">
          <StatusBadge expiry={form.expiry_date} alertDays={form.alert_days || 30} />
          <span className="text-[10px] text-muted-foreground">Status auto-derived from expiry date</span>
        </div>
      )}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Alert Threshold (days before expiry)</Label>
        <Select value={String(form.alert_days || 30)} onValueChange={v => update('alert_days', Number(v))}>
          <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="60">60 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Document File</Label>
        {form.file_url ? (
          <div className="flex items-center gap-2 glass-card p-2.5">
            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
            <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex-1 truncate flex items-center gap-1">
              View uploaded file <ExternalLink className="w-3 h-3" />
            </a>
            <Button variant="ghost" size="sm" onClick={() => update('file_url', '')} className="text-muted-foreground hover:text-red-400 h-7 px-2"><Trash2 className="w-3 h-3" /></Button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Upload PDF or image'}</span>
            <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,image/*" />
          </label>
        )}
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Notes</Label>
        <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} className={inputCls} />
      </div>
      {editItem?.renewal_history?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <History className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Renewal History ({editItem.renewal_history.length})</p>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto thin-scroll">
            {[...editItem.renewal_history].reverse().map((r, i) => (
              <div key={i} className="glass-card px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{r.old_expiry ? formatDate(r.old_expiry) : '—'}</span>
                  <span className="text-muted-foreground">→</span>
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
        <Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          {saving ? t('loading') : (editItem ? t('save') : t('add_new'))}
        </Button>
      </div>
    </div>
  );
}