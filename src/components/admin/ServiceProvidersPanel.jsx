import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, LayoutGrid, Search, Store, Plus, Truck, Users, TrendingDown, Wrench } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ExportButtons from '@/components/common/ExportButtons';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const TYPE_LABELS = { vehicle_supplier: 'Vehicle Supplier', driver_supplier: 'Driver Supplier', both: 'Both' };
const TYPE_COLORS = { vehicle_supplier: '#3b82f6', driver_supplier: '#0ea5e9', both: '#8b5cf6' };
const STATUS_COLOR = { active: '#22C55E', inactive: '#94A3B8' };

export default function ServiceProvidersPanel() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [mode, setMode] = useState('analytics');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Vendor.filter({ category: 'service_provider' }).catch(() => []),
      base44.entities.Vehicle.list('-created_date', 500).catch(() => []),
      base44.entities.Driver.list('-created_date', 500).catch(() => []),
      base44.entities.VendorExpense.list('-created_date', 500).catch(() => []),
    ]).then(([v, ve, d, e]) => {
      setVendors(v || []);
      setVehicles(ve || []);
      setDrivers(d || []);
      setExpenses(e || []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Listen for sub-header "Add New" event
  useEffect(() => {
    const onNew = () => { setEditItem(null); setFormOpen(true); };
    window.addEventListener('service-providers:new', onNew);
    return () => window.removeEventListener('service-providers:new', onNew);
  }, []);

  const vehicleCount = (name) => vehicles.filter((v) => v.vendor_name === name).length;
  const driverCount = (name) => drivers.filter((d) => d.vendor_name === name).length;
  const spendMap = {};
  expenses.forEach((e) => { if (e.vendor_name) spendMap[e.vendor_name] = (spendMap[e.vendor_name] || 0) + (Number(e.amount) || 0); });

  const totalVehicles = vendors.reduce((s, v) => s + vehicleCount(v.name), 0);
  const totalDrivers = vendors.reduce((s, v) => s + driverCount(v.name), 0);
  const totalSpend = vendors.reduce((s, v) => s + (spendMap[v.name] || 0), 0);

  const searched = vendors.filter((v) => !search || v.name?.toLowerCase().includes(search.toLowerCase()));

  const handleEdit = (v) => { setEditItem(v || null); setFormOpen(true); };

  const exportData = vendors.map((v) => ({
    name: v.name, type: TYPE_LABELS[v.provider_type] || '—',
    vehicles: vehicleCount(v.name), drivers: driverCount(v.name),
    spend: spendMap[v.name] || 0, status: v.status,
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="hud-icon-tile w-12 h-12"><Wrench className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">Service Providers</h1>
            <p className="text-sm text-muted-foreground">Vehicle & driver suppliers</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button onClick={() => setMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
            <button onClick={() => setMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
          </div>
          <ExportButtons data={exportData} filename="service-providers" title="Service Providers" columns={[
            { label: 'Name', key: 'name' }, { label: 'Type', key: 'type' },
            { label: 'Vehicles', key: 'vehicles', numeric: true }, { label: 'Drivers', key: 'drivers', numeric: true },
            { label: 'Spend', key: 'spend', numeric: true }, { label: 'Status', key: 'status' },
          ]} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ReportStatCard index={0} label="Total Providers" value={vendors.length} icon={Store} color="#f59e0b" />
        <ReportStatCard index={1} label="Vehicles Supplied" value={totalVehicles} icon={Truck} color="#3b82f6" />
        <ReportStatCard index={2} label="Drivers Supplied" value={totalDrivers} icon={Users} color="#0ea5e9" />
        <ReportStatCard index={3} label="Total Spend" value={totalSpend} format={formatCurrency} icon={TrendingDown} color="#ef4444" />
      </div>

      {mode === 'browse' && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search service providers..." className="pl-9 search-2026 h-10" />
        </div>
      )}

      {mode === 'analytics' ? (
        <div className="space-y-4">
          {loading ? <LoadingSpinner /> : vendors.length === 0 ? (
            <EmptyState icon={Wrench} title="No service providers yet" description="Add a service provider to track vehicle and driver suppliers." />
          ) : (
            <div className="space-y-2">
              {vendors.map((v) => {
                const tone = TYPE_COLORS[v.provider_type] || '#94a3b8';
                const statusColor = STATUS_COLOR[v.status] || '#94A3B8';
                return (
                  <div key={v.id} className="row-card row-edge-glow flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/admin/service-providers/${v.id}`)} style={{ ['--row-accent']: tone }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${tone}1a`, border: `1px solid ${tone}55` }}>
                      <Wrench className="w-5 h-5" style={{ color: tone }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{v.name}</p>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider" style={{ color: tone, background: `${tone}15` }}>{TYPE_LABELS[v.provider_type] || '—'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {vehicleCount(v.name)} vehicles · {driverCount(v.name)} drivers
                        {v.contact_person ? ` · ${v.contact_person}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(spendMap[v.name] || 0)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Spend</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: statusColor, background: `${statusColor}15` }}>
                      <span className="w-1 h-1 rounded-full" style={{ background: statusColor }} />{v.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        loading ? <LoadingSpinner /> : searched.length === 0 ? (
          <EmptyState icon={Wrench} title="No service providers found" />
        ) : (
          <div className="space-y-2">
            {searched.map((v) => {
              const tone = TYPE_COLORS[v.provider_type] || '#94a3b8';
              return (
                <div key={v.id} className="row-card row-edge-glow flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/admin/service-providers/${v.id}`)} style={{ ['--row-accent']: tone }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${tone}1a`, border: `1px solid ${tone}55` }}>
                    <Wrench className="w-5 h-5" style={{ color: tone }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{v.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{TYPE_LABELS[v.provider_type] || '—'} · {v.phone || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0 text-xs text-muted-foreground">
                    <p>{vehicleCount(v.name)} veh · {driverCount(v.name)} drv</p>
                    <p className="font-semibold text-foreground">{formatCurrency(spendMap[v.name] || 0)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Service Provider</SheetTitle></SheetHeader>
          <ServiceProviderForm editItem={editItem} onSave={async (data) => {
            if (editItem) await base44.entities.Vendor.update(editItem.id, data);
            else await base44.entities.Vendor.create({ ...data, category: 'service_provider' });
            load(); setFormOpen(false);
          }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ServiceProviderForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', provider_type: 'vehicle_supplier', contract_start_date: '', contract_end_date: '', rate_terms: '', status: 'active', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem }); else setForm({ name: '', contact_person: '', email: '', phone: '', address: '', provider_type: 'vehicle_supplier', contract_start_date: '', contract_end_date: '', rate_terms: '', status: 'active', notes: '' }); }, [editItem]);
  const update = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));
  const handle = async () => { setSaving(true); await onSave(form); setSaving(false); };

  return (
    <div className="space-y-4">
      <div><Label className="text-xs text-muted-foreground mb-1.5">Company Name *</Label><Input value={form.name} onChange={(e) => update('name', e.target.value)} className="bg-background border-border" /></div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Provider Type</Label>
        <Select value={form.provider_type} onValueChange={(v) => update('provider_type', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="vehicle_supplier">Vehicle Supplier</SelectItem>
          <SelectItem value="driver_supplier">Driver Supplier</SelectItem>
          <SelectItem value="both">Both</SelectItem>
        </SelectContent></Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Contact Person</Label><Input value={form.contact_person} onChange={(e) => update('contact_person', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Phone</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Email</Label><Input value={form.email} onChange={(e) => update('email', e.target.value)} className="bg-background border-border" /></div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Address</Label><Input value={form.address} onChange={(e) => update('address', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Contract Start</Label><Input type="date" value={form.contract_start_date || ''} onChange={(e) => update('contract_start_date', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Contract End</Label><Input type="date" value={form.contract_end_date || ''} onChange={(e) => update('contract_end_date', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Rate Terms</Label><Input value={form.rate_terms} onChange={(e) => update('rate_terms', e.target.value)} placeholder="e.g. AED 200/day, AED 5000/month" className="bg-background border-border" /></div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Status</Label>
        <Select value={form.status} onValueChange={(v) => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent></Select>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Notes</Label><Input value={form.notes} onChange={(e) => update('notes', e.target.value)} className="bg-background border-border" /></div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving || !form.name} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>
  );
}