import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, Mail, Phone, MapPin, Wrench, Receipt, Plus, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import StatusBadge from '@/components/common/StatusBadge';
import { downloadMaintenancePDF } from '@/lib/maintenancePdf';
import { getCompanySettings } from '@/lib/companySettings';

const CAT_COLORS = { fuel: '#1ED760', maintenance: '#f59e0b', parts: '#a855f7', insurance: '#34d399', other: '#94a3b8' };
const TYPE_TONE = { oil_change: '#f97316', tire: '#1ED760', brake: '#ef4444', engine: '#a855f7', electrical: '#eab308', body: '#ec4899', inspection: '#14b8a6', other: '#94a3b8' };

export default function VendorDetailSheet({ open, onOpenChange, vendor, onEdit, onSaved }) {
  const [services, setServices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vendor?.name) return;
    setLoading(true);
    Promise.all([
      base44.entities.ServiceRecord.filter({ vendor_name: vendor.name }).catch(() => []),
      base44.entities.VendorExpense.filter({ vendor_name: vendor.name }).catch(() => []),
    ]).then(([s, e]) => { setServices(s || []); setExpenses(e || []); }).finally(() => setLoading(false));
  }, [vendor?.name]);

  if (!vendor) return null;
  const tone = CAT_COLORS[vendor.category] || '#94a3b8';
  const totalSpend = [...services, ...expenses].reduce((s, r) => s + (Number(r.cost || r.amount) || 0), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-lg overflow-y-auto" side="right">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${tone}1a`, border: `1px solid ${tone}55` }}>
              <Store className="w-6 h-6" style={{ color: tone }} />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="font-display text-foreground truncate">{vendor.name}</SheetTitle>
              <p className="text-xs text-muted-foreground capitalize">{vendor.category} · {vendor.status}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEdit?.(vendor)} className="border-border">Edit</Button>
          </div>
        </SheetHeader>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {vendor.contact_person && <div className="rounded-lg p-2.5 bg-muted/30 border border-border"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Contact</p><p className="text-xs text-foreground truncate">{vendor.contact_person}</p></div>}
          {vendor.phone && <div className="rounded-lg p-2.5 bg-muted/30 border border-border flex items-center gap-1.5"><Phone className="w-3 h-3 text-muted-foreground" /><p className="text-xs text-foreground truncate">{vendor.phone}</p></div>}
          {vendor.email && <div className="rounded-lg p-2.5 bg-muted/30 border border-border flex items-center gap-1.5"><Mail className="w-3 h-3 text-muted-foreground" /><p className="text-xs text-foreground truncate">{vendor.email}</p></div>}
          {vendor.trn && <div className="rounded-lg p-2.5 bg-muted/30 border border-border"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">TRN</p><p className="text-xs text-foreground truncate">{vendor.trn}</p></div>}
        </div>

        {/* Spend summary */}
        <div className="rounded-xl p-3 mb-4" style={{ background: `${tone}0d`, border: `1px solid ${tone}30` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Spend</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{formatCurrency(totalSpend)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Records</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{services.length + expenses.length}</p>
            </div>
          </div>
        </div>

        {/* Maintenance Records */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4" style={{ color: tone }} />
            <h3 className="text-sm font-semibold text-foreground">Maintenance Records</h3>
            <span className="text-xs text-muted-foreground">({services.length})</span>
          </div>
          {loading ? (
            <div className="h-20 flex items-center justify-center"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          ) : services.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No maintenance records</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto thin-scroll">
              {services.map((r) => {
                const sTone = TYPE_TONE[r.service_type] || '#94a3b8';
                return (
                  <div key={r.id} className="rounded-lg p-2.5 flex items-center gap-2.5" style={{ background: `${sTone}0d`, border: `1px solid ${sTone}25` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${sTone}1a` }}><Wrench className="w-3.5 h-3.5" style={{ color: sTone }} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground capitalize truncate">{(r.service_type || 'other').replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{r.vehicle_plate} · {formatDate(r.date)}{r.maint_ref ? ` · ${r.maint_ref}` : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-foreground tabular-nums">{formatCurrency(r.cost)}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <button type="button" onClick={async () => { const s = await getCompanySettings(); await downloadMaintenancePDF(r, s); }} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-white/5 transition-colors flex-shrink-0" title="Download PDF"><Download className="w-3.5 h-3.5" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vendor Expenses */}
        {expenses.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4" style={{ color: tone }} />
              <h3 className="text-sm font-semibold text-foreground">Vendor Expenses</h3>
              <span className="text-xs text-muted-foreground">({expenses.length})</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto thin-scroll">
              {expenses.map((r) => (
                <div key={r.id} className="rounded-lg p-2.5 flex items-center gap-2.5 bg-muted/20 border border-border">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-500/10"><Receipt className="w-3.5 h-3.5 text-amber-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{r.description || r.category}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{formatDate(r.date)}</p>
                  </div>
                  <p className="text-xs font-semibold text-foreground tabular-nums flex-shrink-0">{formatCurrency(r.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}