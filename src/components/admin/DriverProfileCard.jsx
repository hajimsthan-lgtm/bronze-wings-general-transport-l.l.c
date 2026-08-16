import { useState } from 'react';
import { Phone, Mail, BadgeCheck, ChevronDown, Truck, Wallet, ShieldCheck, Globe2, CalendarDays, HeartPulse, TrendingUp, FileText, Car, Pencil } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import DriverEditDialog from '@/components/admin/DriverEditDialog';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const expiryTone = (d) => {
  if (!d) return 'text-muted-foreground';
  const today = new Date().toISOString().split('T')[0];
  if (d < today) return 'text-rose-400';
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  return d <= soon ? 'text-amber-400' : 'text-foreground';
};

const CARD_BASE = {
  ['--row-accent']: '#34d399',
  borderTop: '3px solid #34d399',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 18px rgba(0,0,0,0.3)',
};

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs px-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold truncate text-right ${tone || 'text-foreground'}`}>{value || '—'}</span>
    </div>
  );
}

function AccordionItem({ title, icon: Icon, accent, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border overflow-hidden transition-all duration-200 hover:-translate-y-px hover:shadow-md" style={{ background: hexToRgba('#ffffff', 0.03) }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/30 transition-colors duration-200">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(accent, 0.14), border: `1px solid ${hexToRgba(accent, 0.3)}` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </span>
        <span className="text-sm font-medium text-foreground flex-1 text-left">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-0.5 space-y-2 border-t border-border/40">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function DriverProfileCard({ driver, vehicle, stats, onSave }) {
  const isActive = driver.status === 'active';
  const dotColor = isActive ? '#34d399' : driver.status === 'on_leave' ? '#f59e0b' : '#94a3b8';
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* ===== Profile Card — banded model ===== */}
      <div className="glass-card relative overflow-hidden row-edge-glow animate-fade-in-up" style={CARD_BASE}>
        {/* edit pencil — top corner */}
        <button
          onClick={() => setEditOpen(true)}
          aria-label="Edit driver"
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {/* header band */}
        <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${hexToRgba('#34d399', 0.10)} 0%, transparent 100%)` }}>
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-25" style={{ background: `radial-gradient(circle, ${hexToRgba('#34d399', 0.5)} 0%, transparent 70%)` }} />
          <div className="relative flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 rounded-xl animate-halo pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.40) 0%, transparent 70%)' }} />
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-muted/40 flex items-center justify-center">
                {driver.image_url
                  ? <img src={driver.image_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xl font-bold text-white entity-avatar w-full h-full flex items-center justify-center">{initialsOf(driver.name)}</span>}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-foreground leading-tight truncate">{driver.name}</h2>
                <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="relative flex w-2 h-2">
                  {isActive && <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: dotColor }} />}
                  <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: dotColor }} />
                </span>
                <span className="text-xs text-muted-foreground">Transport Driver</span>
              </div>
            </div>
            <StatusBadge status={driver.status} />
          </div>
        </div>

        {/* inline stats strip */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
          {[
            { label: 'Trips', value: stats?.trips ?? 0, accent: 'hsl(var(--foreground))' },
            { label: 'Revenue', value: formatCurrency(stats?.revenue ?? 0), accent: '#34d399' },
            { label: 'Experience', value: stats?.experience ?? '—', accent: 'hsl(var(--foreground))' },
          ].map((s) => (
            <div key={s.label} className="px-2 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{s.label}</p>
              <p className="text-sm font-semibold tabular-nums truncate" style={{ color: s.accent }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* info rows */}
        <div className="px-5 py-4 space-y-2.5">
          {driver.phone && (
            <a href={`tel:${driver.phone}`} className="flex items-center gap-2.5 text-xs hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors">
              <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">Phone</span>
              <span className="ml-auto font-semibold text-foreground truncate">{driver.phone}</span>
            </a>
          )}
          {driver.email && (
            <a href={`mailto:${driver.email}`} className="flex items-center gap-2.5 text-xs hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors">
              <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">Email</span>
              <span className="ml-auto font-semibold text-foreground truncate">{driver.email}</span>
            </a>
          )}
          <div className="flex items-center gap-2.5 text-xs">
            <Wallet className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-muted-foreground">Base Salary</span>
            <span className="ml-auto font-semibold text-foreground tabular-nums">{formatCurrency(driver.base_salary)}</span>
          </div>
        </div>

        {/* assigned vehicle */}
        {vehicle && (
          <div className="mx-5 mb-5 flex items-center gap-3 rounded-xl p-3 border border-white/[0.06]" style={{ background: hexToRgba('#1ED760', 0.06) }}>
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Car className="w-4 h-4 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{vehicle.make} {vehicle.model}</p>
              <p className="text-xs text-muted-foreground">{vehicle.plate_number}</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== License & Details Card ===== */}
      <div className="glass-card p-5 relative overflow-hidden row-edge-glow animate-fade-in-up" style={CARD_BASE}>
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba('#a855f7', 0.5)} 0%, transparent 70%)` }} />
        <div className="relative flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba('#a855f7', 0.14), border: `1px solid ${hexToRgba('#a855f7', 0.3)}` }}>
            <FileText className="w-4 h-4" style={{ color: '#a855f7' }} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">License &amp; Details</h3>
        </div>

        <div className="relative space-y-2">
          <AccordionItem title="License" icon={ShieldCheck} accent="#1ED760" defaultOpen>
            <Row label="License #" value={driver.license_number} />
            <Row label="License Expiry" value={formatDate(driver.license_expiry)} tone={expiryTone(driver.license_expiry)} />
            <Row label="Visa Expiry" value={formatDate(driver.visa_expiry)} tone={expiryTone(driver.visa_expiry)} />
          </AccordionItem>
          <AccordionItem title="Personal Details" icon={Globe2} accent="#a855f7">
            <Row label="Nationality" value={driver.nationality} />
            <Row label="Join Date" value={formatDate(driver.join_date)} />
            <Row label="Experience" value={stats?.experience} />
            <Row label="Emergency" value={driver.emergency_contact} />
          </AccordionItem>
          <AccordionItem title="Base Salary" icon={Wallet} accent="#34d399">
            <Row label="Base Salary" value={formatCurrency(driver.base_salary)} />
            <Row label="Status" value={driver.status?.replace(/_/g, ' ')} />
          </AccordionItem>
          <AccordionItem title="Profit Summary" icon={TrendingUp} accent="#f59e0b">
            <Row label="Trip Revenue" value={formatCurrency(stats?.revenue ?? 0)} tone="text-emerald-400" />
            <Row label="Expenses" value={formatCurrency(stats?.expenses ?? 0)} tone="text-amber-400" />
            <Row label="Salary" value={formatCurrency(stats?.salary ?? 0)} tone="text-sky-400" />
            <Row label="Net Profit" value={formatCurrency(stats?.netProfit ?? 0)} tone={(stats?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
          </AccordionItem>
        </div>
      </div>

      <DriverEditDialog open={editOpen} onOpenChange={setEditOpen} driver={driver} onSave={onSave} />
    </div>
  );
}