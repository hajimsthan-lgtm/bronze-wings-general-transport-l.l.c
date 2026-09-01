import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { safeAll } from '@/lib/safeRequest';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Bug, RefreshCw, AlertTriangle, AlertOctagon, Info, CheckCircle2,
  Sparkles, Loader2, ChevronRight, Filter, ShieldCheck, Lightbulb,
} from 'lucide-react';

/**
 * Universal Data Auditor — scans every major entity across the app for
 * mismatched / illogical records and shows each issue with a concrete fix.
 * Rule-based checks give reliable, deterministic results; the AI Advisor
 * button asks the LLM to prioritise the current issue list.
 */
const SEV = {
  critical: { color: '#ef4444', icon: AlertOctagon, label: 'Critical' },
  warning: { color: '#f59e0b', icon: AlertTriangle, label: 'Warning' },
  info: { color: '#0ea5e9', icon: Info, label: 'Info' },
};

const num = (v) => (typeof v === 'number' ? v : parseFloat(v) || 0);

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

// ── Rule-based scanners ──────────────────────────────────────────
function scanTrips(trips = []) {
  const out = [];
  trips.forEach((t) => {
    if (!t.vehicle_plate && !t.vehicle_id) out.push({ entity: 'Trip', ref: t.trip_number || t.id, field: 'Vehicle', severity: 'warning', issue: 'Trip has no vehicle assigned.', solution: 'Assign a vehicle or set the trip to draft.', to: '/trips' });
    if (!t.driver_name && !t.driver_id) out.push({ entity: 'Trip', ref: t.trip_number || t.id, field: 'Driver', severity: 'warning', issue: 'Trip has no driver assigned.', solution: 'Assign a driver before dispatching.', to: '/trips' });
    const rev = num(t.total_fare || t.trip_fare || t.revenue);
    const cost = num(t.vendor_cost || t.vendor_amount);
    if (t.status === 'completed' && rev <= 0) out.push({ entity: 'Trip', ref: t.trip_number || t.id, field: 'Revenue', severity: 'warning', issue: 'Completed trip has zero revenue.', solution: 'Enter the trip fare or mark as non-billable.', to: '/trips' });
    if (rev > 0 && cost > rev) out.push({ entity: 'Trip', ref: t.trip_number || t.id, field: 'Vendor cost', severity: 'critical', issue: `Vendor cost (${cost.toFixed(0)}) exceeds revenue (${rev.toFixed(0)}).`, solution: 'Correct the vendor rate or trip fare — this trip loses money.', to: '/trips' });
    const dd = t.delivery_date ? new Date(t.delivery_date) : null;
    const td = t.trip_date ? new Date(t.trip_date) : null;
    if (dd && td && dd < td) out.push({ entity: 'Trip', ref: t.trip_number || t.id, field: 'Dates', severity: 'critical', issue: 'Delivery date is before the trip date.', solution: 'Fix the delivery or trip date.', to: '/trips' });
    const dDays = daysUntil(t.delivery_date);
    if ((t.status === 'scheduled' || t.status === 'in_transit') && dDays !== null && dDays < -1) out.push({ entity: 'Trip', ref: t.trip_number || t.id, field: 'Status', severity: 'warning', issue: `Trip past delivery date by ${Math.abs(dDays)}d but not completed.`, solution: 'Mark the trip completed or cancel it.', to: '/trips' });
  });
  return out;
}

function scanInvoices(invoices = []) {
  const out = [];
  invoices.forEach((i) => {
    const sub = num(i.subtotal); const vat = num(i.vat_amount); const total = num(i.total_amount);
    if (sub > 0 && Math.abs((sub + vat) - total) > 1) out.push({ entity: 'Invoice', ref: i.invoice_number || i.id, field: 'Totals', severity: 'critical', issue: `Subtotal+VAT (${(sub + vat).toFixed(0)}) ≠ total (${total.toFixed(0)}).`, solution: 'Recompute the invoice totals.', to: '/accounts/invoices' });
    const paid = num(i.paid_amount);
    if (paid > total && total > 0) out.push({ entity: 'Invoice', ref: i.invoice_number || i.id, field: 'Payment', severity: 'critical', issue: `Paid (${paid.toFixed(0)}) exceeds total (${total.toFixed(0)}).`, solution: 'Correct the paid amount or apply a credit note.', to: '/accounts/invoices' });
    const dDays = daysUntil(i.due_date);
    if (i.status === 'sent' && dDays !== null && dDays < 0) out.push({ entity: 'Invoice', ref: i.invoice_number || i.id, field: 'Status', severity: 'warning', issue: `Past due by ${Math.abs(dDays)}d but still "sent".`, solution: 'Mark the invoice as overdue and follow up.', to: '/accounts/invoices' });
    if (!i.client_name) out.push({ entity: 'Invoice', ref: i.invoice_number || i.id, field: 'Client', severity: 'info', issue: 'Invoice has no client name.', solution: 'Link the invoice to a client.', to: '/accounts/invoices' });
  });
  return out;
}

function scanVehicles(vehicles = []) {
  const out = [];
  vehicles.forEach((v) => {
    const reg = daysUntil(v.registration_expiry);
    const ins = daysUntil(v.insurance_expiry);
    if (v.status === 'active' && reg !== null && reg < 0) out.push({ entity: 'Vehicle', ref: v.plate_number || v.id, field: 'Registration', severity: 'critical', issue: 'Active vehicle has expired registration.', solution: 'Renew registration or set status to inactive.', to: `/admin/vehicles/${v.id}` });
    if (v.status === 'active' && ins !== null && ins < 0) out.push({ entity: 'Vehicle', ref: v.plate_number || v.id, field: 'Insurance', severity: 'critical', issue: 'Active vehicle has expired insurance.', solution: 'Renew insurance or take the vehicle off the road.', to: `/admin/vehicles/${v.id}` });
    if (v.assigned_driver && v.status === 'inactive') out.push({ entity: 'Vehicle', ref: v.plate_number || v.id, field: 'Assignment', severity: 'warning', issue: 'Inactive vehicle still has an assigned driver.', solution: 'Unassign the driver or reactivate the vehicle.', to: `/admin/vehicles/${v.id}` });
    if (!v.plate_number) out.push({ entity: 'Vehicle', ref: v.id, field: 'Plate', severity: 'warning', issue: 'Vehicle has no plate number.', solution: 'Add the plate number.', to: '/admin/vehicles' });
  });
  return out;
}

function scanDrivers(drivers = []) {
  const out = [];
  drivers.forEach((d) => {
    const lic = daysUntil(d.license_expiry);
    if (lic !== null && lic < 0) out.push({ entity: 'Driver', ref: d.name || d.id, field: 'License', severity: 'critical', issue: 'Driving license expired.', solution: 'Renew the license or suspend the driver.', to: `/admin/drivers/${d.id}` });
    if (!d.name) out.push({ entity: 'Driver', ref: d.id, field: 'Name', severity: 'warning', issue: 'Driver has no name.', solution: 'Add the driver name.', to: '/admin/drivers' });
  });
  return out;
}

function scanMoney(rows, entityName, path, opts = {}) {
  const out = [];
  rows.forEach((r) => {
    const amt = num(r.amount ?? r.total_cost ?? r.total_with_vat);
    if (amt <= 0) out.push({ entity: entityName, ref: r.reference_number || r.id, field: 'Amount', severity: 'warning', issue: `${entityName} record has zero/negative amount.`, solution: 'Correct the amount or delete the record.', to: path });
    if (opts.vat && r.vat_amount != null && r.total_with_vat != null) {
      const base = num(r.amount ?? r.total_cost);
      const v = num(r.vat_amount);
      if (base > 0 && Math.abs((base + v) - num(r.total_with_vat)) > 1) out.push({ entity: entityName, ref: r.reference_number || r.id, field: 'VAT', severity: 'warning', issue: 'VAT + base ≠ total.', solution: 'Recompute the VAT breakdown.', to: path });
    }
  });
  return out;
}

function scanClients(rows = []) {
  const out = [];
  rows.forEach((c) => {
    if (!c.name) out.push({ entity: 'Client', ref: c.id, field: 'Name', severity: 'warning', issue: 'Client has no name.', solution: 'Add the client name.', to: '/admin/clients' });
    if (c.status === 'active' && !c.phone && !c.email) out.push({ entity: 'Client', ref: c.name || c.id, field: 'Contact', severity: 'info', issue: 'Active client has no phone or email.', solution: 'Add contact details.', to: '/admin/clients' });
  });
  return out;
}

function scanVendors(rows = []) {
  const out = [];
  rows.forEach((v) => {
    if (!v.name) out.push({ entity: 'Vendor', ref: v.id, field: 'Name', severity: 'warning', issue: 'Vendor has no name.', solution: 'Add the vendor name.', to: '/admin/vendors' });
    if (v.status === 'active' && !v.phone && !v.email) out.push({ entity: 'Vendor', ref: v.name || v.id, field: 'Contact', severity: 'info', issue: 'Active vendor has no contact info.', solution: 'Add contact details.', to: '/admin/vendors' });
  });
  return out;
}

export default function DataAuditorModal({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [advisor, setAdvisor] = useState(null);
  const [asking, setAsking] = useState(false);

  const runScan = useCallback(async () => {
    setLoading(true); setAdvisor(null);
    try {
      const [trips, invoices, vehicles, drivers, expenses, fuel, clients, vendors, salary] = await safeAll([
        () => base44.entities.Trip.list('-updated_date', 200).catch(() => []),
        () => base44.entities.Invoice.list('-updated_date', 100).catch(() => []),
        () => base44.entities.Vehicle.list().catch(() => []),
        () => base44.entities.Driver.list().catch(() => []),
        () => base44.entities.Expense.list('-updated_date', 100).catch(() => []),
        () => base44.entities.FuelRecord.list('-updated_date', 100).catch(() => []),
        () => base44.entities.Client.list().catch(() => []),
        () => base44.entities.Vendor.list().catch(() => []),
        () => base44.entities.SalaryRecord.list('-updated_date', 100).catch(() => []),
      ], 1);
      const all = [
        ...scanTrips(trips),
        ...scanInvoices(invoices),
        ...scanVehicles(vehicles),
        ...scanDrivers(drivers),
        ...scanMoney(expenses, 'Expense', '/expenses', { vat: true }),
        ...scanMoney(fuel, 'Fuel', '/fuel', { vat: true }),
        ...scanClients(clients),
        ...scanVendors(vendors),
        ...scanMoney(salary, 'Salary', '/salary'),
      ];
      setIssues(all);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (open) runScan(); }, [open, runScan]);

  const stats = useMemo(() => ({
    total: issues.length,
    critical: issues.filter((i) => i.severity === 'critical').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  }), [issues]);

  const entities = useMemo(() => {
    const m = new Map();
    issues.forEach((i) => m.set(i.entity, (m.get(i.entity) || 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [issues]);

  const filtered = useMemo(() => {
    if (filter === 'all') return issues;
    if (filter === 'critical') return issues.filter((i) => i.severity === 'critical');
    return issues.filter((i) => i.entity === filter);
  }, [issues, filter]);

  const askAdvisor = async () => {
    if (issues.length === 0) return;
    setAsking(true); setAdvisor(null);
    try {
      const summary = issues.slice(0, 40).map((i, idx) => `${idx + 1}. [${i.severity}] ${i.entity} ${i.ref}: ${i.issue} → Fix: ${i.solution}`).join('\n');
      const prompt = `You are a data-integrity advisor for a transport company app. Here is a list of data issues found by automated checks. Prioritise them, group by urgency, and give a short action plan (max 6 bullet points, plain text, no markdown headers).\n\nIssues:\n${summary}`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt, model: 'gemini_3_flash' });
      setAdvisor(typeof res === 'string' ? res : JSON.stringify(res));
    } catch {
      setAdvisor('Advisor unavailable right now. The rule-based fixes above are reliable — address critical issues first.');
    } finally { setAsking(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-hidden flex flex-col bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-foreground">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.18), rgba(var(--panel-accent2-rgb),0.10))', border: '1px solid rgba(var(--panel-accent-rgb),0.3)' }}>
              <Bug className="w-4.5 h-4.5 text-primary" />
            </div>
            Data Auditor
            <span className="text-xs font-normal text-muted-foreground">— all pages</span>
          </DialogTitle>
          <DialogDescription>
            Scans every module for mismatched or illogical records and suggests a fix for each.
          </DialogDescription>
        </DialogHeader>

        {/* Summary + actions */}
        <div className="flex items-center gap-2 flex-wrap px-1">
          <SummaryPill label="Total" value={stats.total} color="rgb(var(--panel-accent-rgb))" />
          <SummaryPill label="Critical" value={stats.critical} color="#ef4444" pulse={stats.critical > 0} />
          <SummaryPill label="Warnings" value={stats.warning} color="#f59e0b" />
          <SummaryPill label="Info" value={stats.info} color="#0ea5e9" />
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={runScan} disabled={loading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Re-scan
          </Button>
          <Button size="sm" onClick={askAdvisor} disabled={asking || issues.length === 0} className="gap-1.5">
            {asking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} AI Advisor
          </Button>
        </div>

        {/* Advisor panel */}
        {advisor && (
          <div className="mx-1 rounded-xl p-3 border border-primary/20 bg-primary/5 flex items-start gap-2.5 animate-fade-in">
            <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">{advisor}</p>
          </div>
        )}

        {/* Filter chips */}
        {!loading && issues.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap px-1">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <Chip label="All" count={stats.total} active={filter === 'all'} onClick={() => setFilter('all')} />
            <Chip label="Critical" count={stats.critical} color="#ef4444" active={filter === 'critical'} onClick={() => setFilter('critical')} />
            {entities.map(([name, n]) => (
              <Chip key={name} label={name} count={n} active={filter === name} onClick={() => setFilter(name)} />
            ))}
          </div>
        )}

        {/* Issue list */}
        <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-1 pb-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Scanning all modules…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <ShieldCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-foreground">No issues found</p>
              <p className="text-xs text-muted-foreground">All scanned records look consistent.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((it, idx) => {
                const sev = SEV[it.severity] || SEV.info;
                const SevIcon = sev.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-xl p-3 border flex items-start gap-3 transition-all hover:border-primary/30 hover:bg-white/[0.03] cursor-pointer group"
                    style={{ borderColor: `${sev.color}30`, background: `${sev.color}08` }}
                    onClick={() => { onOpenChange(false); navigate(it.to); }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${sev.color}1a`, border: `1px solid ${sev.color}33` }}>
                      <SevIcon className="w-4 h-4" style={{ color: sev.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${sev.color}1a`, color: sev.color }}>{it.entity}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{it.ref}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{it.field}</span>
                      </div>
                      <p className="text-sm text-foreground mt-1 leading-snug">{it.issue}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-emerald-500" />
                        <span><span className="font-semibold text-emerald-600 dark:text-emerald-400">Fix:</span> {it.solution}</span>
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryPill({ label, value, color, pulse }) {
  return (
    <div className="relative rounded-lg px-3 py-1.5 border flex items-center gap-2" style={{ borderColor: `${color}33`, background: `${color}0d` }}>
      {pulse && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}`, animation: 'live-pulse 1.6s infinite' }} />}
      <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function Chip({ label, count, color, active, onClick }) {
  const c = color || 'rgb(var(--panel-accent-rgb))';
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
      style={active
        ? { background: `${c}20`, border: `1px solid ${c}55`, color: c }
        : { background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: 'hsl(var(--muted-foreground))' }}
    >
      {label} <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}