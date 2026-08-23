import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import DocumentsSection from '@/components/admin/DocumentsSection';
import StatusBadge from '@/components/common/StatusBadge';
import DetailSkeleton from '@/components/detail/DetailMotion';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CollapsibleSection from '@/components/common/CollapsibleSection';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import { safeAll } from '@/lib/safeRequest';
import { Wrench, Truck, Users, Receipt, Phone, Mail, MapPin, Calendar, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VendorTransactionLedger from '@/components/vendors/VendorTransactionLedger';
import VendorAssetFormSheet from '@/components/vendors/VendorAssetFormSheet';

const TYPE_LABELS = { vehicle_supplier: 'Vehicle Supplier', driver_supplier: 'Driver Supplier', both: 'Both' };
const TYPE_COLORS = { vehicle_supplier: '#3b82f6', driver_supplier: '#0ea5e9', both: '#8b5cf6' };

function Row({ label, value, icon: Icon }) {
  const isEmpty = !value || value === '—';
  return (
    <div className="flex items-center gap-2 text-[13px] px-0.5 py-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium truncate text-right ml-auto tabular-nums ${isEmpty ? 'text-muted-foreground/40' : 'text-foreground'}`}>{value || '—'}</span>
    </div>
  );
}

export default function ServiceProviderDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const { toast } = useToast();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [assetSheet, setAssetSheet] = useState({ open: false, mode: 'vehicle', editRecord: null });
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Vendor.get(id).then(async (v) => {
      if (cancelled) return;
      setVendor(v);
      setLoading(false);
      setDataLoading(true);
      try {
        const [ve, d, e] = await safeAll([
          () => base44.entities.Vehicle.filter({ vendor_name: v.name }).catch(() => []),
          () => base44.entities.Driver.filter({ vendor_name: v.name }).catch(() => []),
          () => base44.entities.Expense.filter({ vendor_name: v.name }).catch(() => []),
        ], 2);
        if (cancelled) return;
        setVehicles(ve || []);
        setDrivers(d || []);
        setExpenses(e || []);
      } finally { if (!cancelled) setDataLoading(false); }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (!vendor) return <EmptyState title="Service provider not found" />;

  const tone = TYPE_COLORS[vendor.provider_type] || '#3b82f6';
  const totalSpend = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const activeVehicles = vehicles.filter((v) => v.supply_status !== 'returned').length;
  const activeDrivers = drivers.filter((d) => d.supply_status !== 'returned').length;

  const saveVendor = async (patch) => {
    const updated = await base44.entities.Vendor.update(vendor.id, patch);
    setVendor(updated);
    setEditOpen(false);
    toast({ title: 'Service provider updated' });
  };

  const openAddAsset = (mode) => setAssetSheet({ open: true, mode, editRecord: null });
  const openEditAsset = (mode, record) => setAssetSheet({ open: true, mode, editRecord: record });

  const onAssetUpdated = (rec) => {
    if (assetSheet.mode === 'vehicle') setVehicles((arr) => arr.map((v) => (v.id === rec.id ? rec : v)));
    else setDrivers((arr) => arr.map((d) => (d.id === rec.id ? rec : d)));
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { type, id: rid } = confirmDelete;
    try {
      if (type === 'vehicle') {
        await base44.entities.Vehicle.delete(rid);
        setVehicles((arr) => arr.filter((v) => v.id !== rid));
      } else {
        await base44.entities.Driver.delete(rid);
        setDrivers((arr) => arr.filter((d) => d.id !== rid));
      }
      toast({ title: type === 'vehicle' ? 'Vehicle removed' : 'Driver removed' });
    } catch (err) {
      toast({ title: 'Failed to delete', description: err?.message, variant: 'destructive' });
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="detail-page space-y-4 max-w-[1600px] mx-auto w-full overflow-x-hidden">
      <EntityDetailHeader
        title={vendor.name}
        subtitle={TYPE_LABELS[vendor.provider_type] || 'Service Provider'}
        badge={<StatusBadge status={vendor.status} />}
        backTo="/admin/vendors"
      />

      {/* Grid: profile (left) | sections (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
        {/* Left: profile column */}
        <div className="space-y-4">
          {/* Identity card */}
          <div className="glass-card relative overflow-hidden animate-fade-in-up" style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.8), inset 0 0 60px ${hexToRgba(tone, 0.06)}, 0 12px 36px rgba(0,0,0,0.10), 0 0 0 1px ${hexToRgba(tone, 0.15)}` }}>
            <div className="absolute -top-1/2 -right-1/4 w-3/4 h-full pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${hexToRgba(tone, 0.14)}, transparent 70%)` }} />
            <button onClick={() => { setEditForm({ ...vendor }); setEditOpen(true); }} className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 active:scale-95">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <div className="p-4 pb-3 flex items-center gap-3 relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(tone, 0.22)}, ${hexToRgba(tone, 0.10)})`, border: `1px solid ${hexToRgba(tone, 0.35)}`, boxShadow: `0 0 18px -4px ${hexToRgba(tone, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.12)` }}>
                <Wrench className="w-7 h-7" style={{ color: tone, filter: `drop-shadow(0 0 6px ${hexToRgba(tone, 0.5)})` }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">{vendor.name}</h2>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ color: tone, background: `${tone}15` }}>
                  {TYPE_LABELS[vendor.provider_type] || 'Service Provider'}
                </span>
              </div>
            </div>
            {/* 3-stat row */}
            <div className="grid grid-cols-3 gap-1 px-4 pb-3 border-t border-border/40">
              <div className="text-center pt-2.5">
                <p className="text-lg font-bold text-foreground tabular-nums">{vehicles.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vehicles</p>
              </div>
              <div className="text-center pt-2.5 border-x border-border/40">
                <p className="text-lg font-bold text-foreground tabular-nums">{drivers.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Drivers</p>
              </div>
              <div className="text-center pt-2.5">
                <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(totalSpend).replace('AED ', '')}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Spend</p>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="glass-card p-4 space-y-0.5">
            <Row label="Contact" value={vendor.contact_person} icon={Users} />
            <Row label="Phone" value={vendor.phone} icon={Phone} />
            <Row label="Email" value={vendor.email} icon={Mail} />
            <Row label="Address" value={vendor.address} icon={MapPin} />
            <Row label="Status" value={vendor.status} />
          </div>

          {/* Contract Details */}
          <CollapsibleSection title="Contract Details" icon={Calendar} accent="#f59e0b" defaultOpen>
            <div className="space-y-0.5">
              <Row label="Start Date" value={formatDate(vendor.contract_start_date)} />
              <Row label="End Date" value={formatDate(vendor.contract_end_date)} />
              <Row label="Rate Terms" value={vendor.rate_terms} />
            </div>
          </CollapsibleSection>

          {/* Rate Terms */}
          <CollapsibleSection title="Rate Terms" icon={FileText} accent="#3b82f6">
            <div className="space-y-0.5">
              <Row label="Rate Terms" value={vendor.rate_terms} />
              <Row label="Active Vehicles" value={`${activeVehicles} / ${vehicles.length}`} />
              <Row label="Active Drivers" value={`${activeDrivers} / ${drivers.length}`} />
            </div>
          </CollapsibleSection>

          {/* Notes */}
          {vendor.notes && (
            <div className="glass-card p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Notes</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{vendor.notes}</p>
            </div>
          )}
        </div>

        {/* Right: record sections */}
        <div className="space-y-4">
          {/* Supplied Vehicles */}
          <CollapsibleSection title="Supplied Vehicles" icon={Truck} accent="#3b82f6" count={vehicles.length} actions={
            <Button onClick={() => openAddAsset('vehicle')} size="sm" className="bg-primary hover:bg-primary/90 h-8">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          }>
            {dataLoading ? <LoadingSpinner /> : vehicles.length === 0 ? (
              <EmptyState icon={Truck} title="No vehicles supplied" />
            ) : (
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <div key={v.id} className="row-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 18px -6px rgba(var(--panel-accent-rgb),0.35)' }}>
                      <Truck className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.plate_number}</p>
                      <p className="text-xs text-muted-foreground capitalize">{v.type} · {formatDate(v.supply_start_date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{v.supply_rate ? formatCurrency(v.supply_rate) : '—'}</span>
                    <StatusBadge status={v.supply_status === 'returned' ? 'inactive' : 'active'} />
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEditAsset('vehicle', v)} title="Edit" className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirmDelete({ type: 'vehicle', id: v.id, label: v.plate_number })} title="Remove" className="text-muted-foreground hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Supplied Drivers */}
          <CollapsibleSection title="Supplied Drivers" icon={Users} accent="#0ea5e9" count={drivers.length} actions={
            <Button onClick={() => openAddAsset('driver')} size="sm" className="bg-primary hover:bg-primary/90 h-8">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          }>
            {dataLoading ? <LoadingSpinner /> : drivers.length === 0 ? (
              <EmptyState icon={Users} title="No drivers supplied" />
            ) : (
              <div className="space-y-2">
                {drivers.map((d) => (
                  <div key={d.id} className="row-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 18px -6px rgba(var(--panel-accent-rgb),0.35)' }}>
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{d.phone} · {formatDate(d.supply_start_date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{d.supply_rate ? formatCurrency(d.supply_rate) : '—'}</span>
                    <StatusBadge status={d.supply_status === 'returned' ? 'inactive' : 'active'} />
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEditAsset('driver', d)} title="Edit" className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirmDelete({ type: 'driver', id: d.id, label: d.name })} title="Remove" className="text-muted-foreground hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Transaction Ledger */}
          <CollapsibleSection title="Transaction Ledger" icon={Receipt} accent="#ef4444">
            <VendorTransactionLedger vendorName={vendor.name} />
          </CollapsibleSection>

          {/* Documents */}
          <DocumentsSection entityType="vendor" entityId={vendor.id} accent="#a855f7" defaultOpen={false} />
        </div>
      </div>

      <VendorAssetFormSheet
        open={assetSheet.open}
        onOpenChange={(o) => setAssetSheet((s) => ({ ...s, open: o }))}
        mode={assetSheet.mode}
        vendorName={vendor.name}
        editRecord={assetSheet.editRecord}
        onCreated={(rec) => {
          if (assetSheet.mode === 'vehicle') setVehicles((v) => [rec, ...v]);
          else setDrivers((d) => [rec, ...d]);
        }}
        onUpdated={onAssetUpdated}
      />

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              Remove {confirmDelete?.type === 'vehicle' ? 'Vehicle' : 'Driver'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <span className="font-medium text-foreground">{confirmDelete?.label}</span> from this vendor's pool? This only removes the record here — it does not affect your main fleet.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1 border-border">Cancel</Button>
            <Button onClick={doDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white">Remove</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">Edit Service Provider</SheetTitle></SheetHeader>
          <div className="space-y-4">
            <div><Label className="text-xs text-muted-foreground mb-1.5">Company Name *</Label><Input value={editForm.name || ''} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="bg-background border-border" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Provider Type</Label>
              <Select value={editForm.provider_type || 'vehicle_supplier'} onValueChange={(v) => setEditForm((f) => ({ ...f, provider_type: v }))}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="vehicle_supplier">Vehicle Supplier</SelectItem>
                <SelectItem value="driver_supplier">Driver Supplier</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground mb-1.5">Contact Person</Label><Input value={editForm.contact_person || ''} onChange={(e) => setEditForm((f) => ({ ...f, contact_person: e.target.value }))} className="bg-background border-border" /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5">Phone</Label><Input value={editForm.phone || ''} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className="bg-background border-border" /></div>
            </div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Email</Label><Input value={editForm.email || ''} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="bg-background border-border" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Address</Label><Input value={editForm.address || ''} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} className="bg-background border-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground mb-1.5">Contract Start</Label><Input type="date" value={editForm.contract_start_date || ''} onChange={(e) => setEditForm((f) => ({ ...f, contract_start_date: e.target.value }))} className="bg-background border-border" /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5">Contract End</Label><Input type="date" value={editForm.contract_end_date || ''} onChange={(e) => setEditForm((f) => ({ ...f, contract_end_date: e.target.value }))} className="bg-background border-border" /></div>
            </div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Rate Terms</Label><Input value={editForm.rate_terms || ''} onChange={(e) => setEditForm((f) => ({ ...f, rate_terms: e.target.value }))} placeholder="e.g. AED 200/day" className="bg-background border-border" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Status</Label>
              <Select value={editForm.status || 'active'} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent></Select>
            </div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Notes</Label><Input value={editForm.notes || ''} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} className="bg-background border-border" /></div>
            <div className="flex gap-3 mt-6"><Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={() => saveVendor(editForm)} className="flex-1 bg-primary hover:bg-primary/90">{t('save')}</Button></div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}