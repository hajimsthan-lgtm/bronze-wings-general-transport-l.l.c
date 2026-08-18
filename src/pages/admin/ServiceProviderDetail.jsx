import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import DocumentsSection from '@/components/admin/DocumentsSection';
import StatusBadge from '@/components/common/StatusBadge';
import DetailSkeleton from '@/components/detail/DetailMotion';
import EmptyState from '@/components/common/EmptyState';
import RecordSectionCard from '@/components/common/RecordSectionCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import { safeAll } from '@/lib/safeRequest';
import { Wrench, Truck, Users, Receipt, Phone, Mail, MapPin, Calendar, FileText, Pencil, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VendorTransactionLedger from '@/components/vendors/VendorTransactionLedger';

const TYPE_LABELS = { vehicle_supplier: 'Vehicle Supplier', driver_supplier: 'Driver Supplier', both: 'Both' };
const TYPE_COLORS = { vehicle_supplier: '#3b82f6', driver_supplier: '#0ea5e9', both: '#8b5cf6' };

function AccordionItem({ sectionKey, openKey, setOpenKey, title, icon: Icon, accent, children }) {
  const open = openKey === sectionKey;
  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200" style={{ background: 'hsl(var(--muted) / 0.3)', borderLeft: open ? `2px solid ${accent}` : '2px solid transparent' }}>
      <button type="button" onClick={() => setOpenKey(open ? null : sectionKey)} className="w-full flex items-center gap-2.5 px-3 min-h-[48px] hover:bg-muted/40 transition-colors duration-200">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.14)}, ${hexToRgba(accent, 0.08)})`, border: `1px solid ${hexToRgba(accent, 0.25)}` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </span>
        <span className="text-sm font-medium text-foreground flex-1 text-left">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden"><div className="px-3 pb-3 pt-1.5 space-y-1.5 border-t border-border/40">{children}</div></div>
      </div>
    </div>
  );
}

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
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [openSection, setOpenSection] = useState('contract');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

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

  return (
    <div className="detail-page space-y-5 pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:h-[calc(100dvh-15rem)]">
        {/* Left: profile column */}
        <div className="lg:h-full lg:overflow-y-auto thin-scroll space-y-5">
          <EntityDetailHeader backTo="/admin/vendors" />
          {/* Identity card */}
          <div className="glass-card relative overflow-hidden animate-fade-in-up">
            <button onClick={() => { setEditForm({ ...vendor }); setEditOpen(true); }} className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 active:scale-95">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <div className="p-4 pb-3 flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(tone, 0.18)}, ${hexToRgba(tone, 0.08)})`, border: `1px solid ${hexToRgba(tone, 0.3)}` }}>
                <Wrench className="w-7 h-7" style={{ color: tone }} />
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

          {/* Accordion: Contract Details */}
          <AccordionItem sectionKey="contract" openKey={openSection} setOpenKey={setOpenSection} title="Contract Details" icon={Calendar} accent="#f59e0b">
            <Row label="Start Date" value={formatDate(vendor.contract_start_date)} />
            <Row label="End Date" value={formatDate(vendor.contract_end_date)} />
            <Row label="Rate Terms" value={vendor.rate_terms} />
          </AccordionItem>

          {/* Accordion: Rate Terms */}
          <AccordionItem sectionKey="rates" openKey={openSection} setOpenKey={setOpenSection} title="Rate Terms" icon={FileText} accent="#3b82f6">
            <Row label="Rate Terms" value={vendor.rate_terms} />
            <Row label="Active Vehicles" value={`${activeVehicles} / ${vehicles.length}`} />
            <Row label="Active Drivers" value={`${activeDrivers} / ${drivers.length}`} />
          </AccordionItem>

          {/* Notes */}
          {vendor.notes && (
            <div className="glass-card p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Notes</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{vendor.notes}</p>
            </div>
          )}
        </div>

        {/* Right: record cards */}
        <div className="space-y-4 lg:h-full lg:overflow-y-auto thin-scroll pr-1">
          {/* Supplied Vehicles */}
          <RecordSectionCard
            title="Supplied Vehicles"
            icon={Truck}
            accent="#3b82f6"
            count={vehicles.length}
            loading={dataLoading}
            emptyIcon={Truck}
            emptyLabel="No vehicles supplied"
            onNew={() => navigate(`/admin/vehicles?new=1&vendor=${encodeURIComponent(vendor.name)}`)}
            newLabel="Add vehicle"
            columns={[
              { label: 'Plate', className: 'col-span-3' },
              { label: 'Type', className: 'col-span-2' },
              { label: 'Since', className: 'col-span-2' },
              { label: 'Rate', className: 'col-span-2 text-right' },
              { label: 'Status', className: 'col-span-3' },
            ]}>
            {vehicles.map((v) => (
              <div key={v.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/admin/vehicles/${v.id}`)}>
                <div className="col-span-3 text-foreground font-medium truncate">{v.plate_number}</div>
                <div className="col-span-2 text-muted-foreground capitalize">{v.type}</div>
                <div className="col-span-2 text-muted-foreground">{formatDate(v.supply_start_date)}</div>
                <div className="col-span-2 text-right font-semibold text-foreground tabular-nums">{v.supply_rate ? formatCurrency(v.supply_rate) : '—'}</div>
                <div className="col-span-3"><StatusBadge status={v.supply_status === 'returned' ? 'inactive' : 'active'} /></div>
              </div>
            ))}
          </RecordSectionCard>

          {/* Supplied Drivers */}
          <RecordSectionCard
            title="Supplied Drivers"
            icon={Users}
            accent="#0ea5e9"
            count={drivers.length}
            loading={dataLoading}
            emptyIcon={Users}
            emptyLabel="No drivers supplied"
            onNew={() => navigate(`/admin/drivers?new=1&vendor=${encodeURIComponent(vendor.name)}`)}
            newLabel="Add driver"
            columns={[
              { label: 'Name', className: 'col-span-3' },
              { label: 'Phone', className: 'col-span-2' },
              { label: 'Since', className: 'col-span-2' },
              { label: 'Rate', className: 'col-span-2 text-right' },
              { label: 'Status', className: 'col-span-3' },
            ]}>
            {drivers.map((d) => (
              <div key={d.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/admin/drivers/${d.id}`)}>
                <div className="col-span-3 text-foreground font-medium truncate">{d.name}</div>
                <div className="col-span-2 text-muted-foreground truncate">{d.phone}</div>
                <div className="col-span-2 text-muted-foreground">{formatDate(d.supply_start_date)}</div>
                <div className="col-span-2 text-right font-semibold text-foreground tabular-nums">{d.supply_rate ? formatCurrency(d.supply_rate) : '—'}</div>
                <div className="col-span-3"><StatusBadge status={d.supply_status === 'returned' ? 'inactive' : 'active'} /></div>
              </div>
            ))}
          </RecordSectionCard>

          {/* Vendor Transaction Ledger */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
                <Receipt className="w-4 h-4 text-red-400" />
              </span>
              <h3 className="text-sm font-semibold text-foreground">Transaction Ledger</h3>
            </div>
            <VendorTransactionLedger vendorName={vendor.name} />
          </div>

          {/* Documents */}
          <DocumentsSection entityType="vendor" entityId={vendor.id} accent="#a855f7" defaultOpen={false} />
        </div>
      </div>

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