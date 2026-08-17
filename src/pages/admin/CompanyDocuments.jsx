import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/formatters';
import { Plus, Search, Award, Pencil, Trash2, Upload, FileText, Loader2, ExternalLink } from 'lucide-react';

const DOC_TYPES = [
  'Trade License (DED)',
  'Establishment / Immigration Card',
  'Chamber of Commerce Certificate',
  'VAT Registration Certificate (TRN)',
  'Transport Permit (DTC / ITC)',
  'Fleet / Vehicle Master Insurance Policy',
  'Public Liability Insurance',
  'Office Tenancy Contract (Tawtheeq)',
  'Civil Defense / Fire Safety Certificate',
  'Customs Code Certificate',
  'Other',
];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

function docStatus(expiry) {
  const days = daysUntil(expiry);
  if (days === null) return 'active';
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'active';
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.35)' },
  expiring_soon: { label: 'Expiring Soon', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)' },
  expired: { label: 'Expired', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)' },
};

function StatusBadge({ expiry }) {
  const status = docStatus(expiry);
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

export default function CompanyDocuments() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.CompanyDocument.list('-created_date', 200).then(setItems).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Auto-open document from URL focus param (deep-link from alert bell)
  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (focusId && items.length > 0 && !formOpen) {
      const doc = items.find(d => d.id === focusId);
      if (doc) {
        setEditItem(doc);
        setFormOpen(true);
        searchParams.delete('focus');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [items, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sort: soonest-expiring first (expired first, then expiring soon, then active, no-expiry last)
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
      d.document_type?.toLowerCase().includes(search.toLowerCase()) ||
      d.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.issuing_authority?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || docStatus(d.expiry_date) === statusFilter;
    const matchType = typeFilter === 'all' || d.document_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter(d => docStatus(d.expiry_date) === 'active').length,
    expiring: items.filter(d => docStatus(d.expiry_date) === 'expiring_soon').length,
    expired: items.filter(d => docStatus(d.expiry_date) === 'expired').length,
  }), [items]);

  return (
    <div>
      <PageHeader icon={Award} title="Company Documents" description="UAE compliance documents & expiry tracking" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total" value={stats.total} color="#3b82f6" />
        <StatCard label="Active" value={stats.active} color="#22c55e" />
        <StatCard label="Expiring Soon" value={stats.expiring} color="#f59e0b" />
        <StatCard label="Expired" value={stats.expired} color="#ef4444" />
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-52 h-10 search-2026"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All Types</SelectItem>
            {DOC_TYPES.map(dt => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10 whitespace-nowrap">
          <Plus className="w-4 h-4 mr-1.5" /> Add Document
        </Button>
      </div>

      {/* List */}
      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Award} title="No company documents" description="Add your first compliance document to start tracking expiries" />
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <div key={doc.id} className="row-card flex items-center gap-4 cursor-pointer" onClick={() => { setEditItem(doc); setFormOpen(true); }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(var(--panel-accent-rgb),0.1)', border: '1px solid rgba(var(--panel-accent-rgb),0.2)' }}>
                <Award className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.document_type}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {doc.reference_number && <span>{doc.reference_number} · </span>}
                  {doc.issuing_authority || 'No authority'}
                </p>
              </div>
              <div className="hidden sm:block text-right flex-shrink-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expiry</p>
                <p className="text-xs font-medium text-foreground">{doc.expiry_date ? formatDate(doc.expiry_date) : '—'}</p>
              </div>
              <StatusBadge expiry={doc.expiry_date} />
              <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => { setEditItem(doc); setFormOpen(true); }} className="text-muted-foreground h-8 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
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
                      <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => { await base44.entities.CompanyDocument.delete(doc.id); load(); }} className="bg-destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-display text-foreground">{editItem ? 'Edit' : 'Add'} Company Document</SheetTitle>
          </SheetHeader>
          <CompanyDocForm
            editItem={editItem}
            onSave={async (data) => {
              if (editItem) await base44.entities.CompanyDocument.update(editItem.id, data);
              else await base44.entities.CompanyDocument.create(data);
              load();
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="glass-card p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}1a`, border: `1px solid ${color}33` }}>
        <span className="text-sm font-bold" style={{ color }}>{value}</span>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

function CompanyDocForm({ editItem, onSave, onCancel }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    document_type: DOC_TYPES[0],
    reference_number: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: '',
    file_url: '',
    notes: '',
  });

  useEffect(() => {
    if (editItem) setForm({ ...form, ...editItem });
    else setForm({ document_type: DOC_TYPES[0], reference_number: '', issuing_authority: '', issue_date: '', expiry_date: '', file_url: '', notes: '' });
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
    if (!form.document_type?.trim()) {
      toast({ variant: 'destructive', title: 'Document type is required' });
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
        <Label className="text-xs text-muted-foreground mb-1.5">Document Type</Label>
        <Input list="company-doc-types" value={form.document_type} onChange={e => update('document_type', e.target.value)} placeholder="Select or type document type" className={inputCls} />
        <datalist id="company-doc-types">
          {DOC_TYPES.map(dt => <option key={dt} value={dt} />)}
        </datalist>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Reference Number</Label>
        <Input value={form.reference_number} onChange={e => update('reference_number', e.target.value)} placeholder="e.g. DED-12345" className={inputCls} />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Issuing Authority</Label>
        <Input value={form.issuing_authority} onChange={e => update('issuing_authority', e.target.value)} placeholder="e.g. Department of Economic Development" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Issue Date</Label>
          <Input type="date" value={form.issue_date} onChange={e => update('issue_date', e.target.value)} className={inputCls} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Expiry Date</Label>
          <Input type="date" value={form.expiry_date} onChange={e => update('expiry_date', e.target.value)} className={inputCls} />
        </div>
      </div>
      {form.expiry_date && (
        <div className="glass-card p-2.5 flex items-center gap-2">
          <StatusBadge expiry={form.expiry_date} />
          <span className="text-[10px] text-muted-foreground">Status auto-derived from expiry date</span>
        </div>
      )}
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
        <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} className={inputCls} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1 border-border">Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : (editItem ? 'Update' : 'Create')}
        </Button>
      </div>
    </div>
  );
}