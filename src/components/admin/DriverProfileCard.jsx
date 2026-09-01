import { useState } from 'react';
import { Phone, Mail, BadgeCheck, Wallet, ShieldCheck, CalendarClock, Car, Pencil, Globe2, TrendingUp } from 'lucide-react';
import DriverEditModal from '@/components/admin/DriverEditModal';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const expiryTone = (d) => {
  if (!d) return 'text-muted-foreground/40';
  const today = new Date().toISOString().split('T')[0];
  if (d < today) return 'text-rose-400';
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  return d <= soon ? 'text-amber-400' : 'text-foreground';
};

const CARD_BASE = {
  ['--row-accent']: '#1ED760',
  borderTop: '3px solid #1ED760',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 18px rgba(0,0,0,0.3)',
};

function Row({ icon: Icon, tone, label, value, href, toneValue }) {
  const content = (
    <>
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${tone}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className={`ml-auto font-semibold tabular-nums truncate ${toneValue || 'text-foreground'}`}>{value}</span>
    </>
  );
  if (href) return (
    <a href={href} className="flex items-center gap-2.5 text-xs hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors">{content}</a>
  );
  return <div className="flex items-center gap-2.5 text-xs">{content}</div>;
}

export default function DriverProfileCard({ driver, vehicle, stats, onSave }) {
  const [editOpen, setEditOpen] = useState(false);
  const isActive = driver.status === 'active';
  const dotColor = isActive ? '#34d399' : driver.status === 'on_leave' ? '#f59e0b' : '#94a3b8';

  const statsList = [
    { label: 'Trips', value: stats?.trips ?? 0, accent: '#1ED760' },
    { label: 'Revenue', value: formatCurrency(stats?.revenue ?? 0), accent: '#34d399' },
    { label: 'Exp.', value: stats?.experience ?? '—', accent: '#a855f7' },
  ];

  const rows = [
    driver.phone && { icon: Phone, tone: 'text-primary', label: 'Phone', value: driver.phone, href: `tel:${driver.phone}` },
    driver.email && { icon: Mail, tone: 'text-primary', label: 'Email', value: driver.email, href: `mailto:${driver.email}` },
    { icon: Wallet, tone: 'text-emerald-400', label: 'Salary', value: formatCurrency(driver.base_salary) },
    driver.license_number && { icon: ShieldCheck, tone: 'text-emerald-400', label: 'License #', value: driver.license_number },
    driver.license_expiry && { icon: CalendarClock, tone: 'text-amber-400', label: 'Lic. Expiry', value: formatDate(driver.license_expiry), toneValue: expiryTone(driver.license_expiry) },
    driver.visa_expiry && { icon: CalendarClock, tone: 'text-sky-400', label: 'Visa Expiry', value: formatDate(driver.visa_expiry), toneValue: expiryTone(driver.visa_expiry) },
    driver.nationality && { icon: Globe2, tone: 'text-violet-400', label: 'Nationality', value: driver.nationality },
    driver.join_date && { icon: CalendarClock, tone: 'text-primary', label: 'Joined', value: formatDate(driver.join_date) },
    driver.emergency_contact && { icon: Phone, tone: 'text-rose-400', label: 'Emergency', value: driver.emergency_contact },
  ].filter(Boolean);

  return (
    <div className="glass-card relative overflow-hidden row-edge-glow animate-fade-in-up" style={CARD_BASE}>
      {/* header band */}
      <div className="relative px-5 pt-4 pb-3 border-b border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${hexToRgba('#1ED760', 0.10)} 0%, transparent 100%)` }}>
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-25" style={{ background: `radial-gradient(circle, ${hexToRgba('#1ED760', 0.5)} 0%, transparent 70%)` }} />
        <div className="relative flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 rounded-xl animate-halo pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(30,215,96,0.40) 0%, transparent 70%)' }} />
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-muted/40 flex items-center justify-center">
              {driver.image_url
                ? <img src={driver.image_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-lg font-bold text-white entity-avatar w-full h-full flex items-center justify-center">{initialsOf(driver.name)}</span>}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-foreground leading-tight break-words">{driver.name}</h2>
              <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex w-2 h-2">
                {isActive && <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: dotColor }} />}
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: dotColor }} />
              </span>
              <span className="text-[11px] text-muted-foreground">Transport Driver</span>
            </div>
          </div>
          <button onClick={() => setEditOpen(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit driver">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <StatusBadge status={driver.status} />
        </div>
      </div>

      {/* inline stats strip */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
        {statsList.map((s) => (
          <div key={s.label} className="px-1.5 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{s.label}</p>
            <p className="text-sm font-semibold tabular-nums truncate" style={{ color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* compact info rows */}
      <div className="px-5 py-3 space-y-2">
        {rows.map((r, i) => <Row key={i} {...r} />)}

        {/* Profit summary — condensed */}
        <div className="pt-2 mt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Profit Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">Revenue</span><span className="ml-auto font-semibold text-emerald-400 tabular-nums">{formatCurrency(stats?.revenue ?? 0)}</span></div>
            <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">Expenses</span><span className="ml-auto font-semibold text-amber-400 tabular-nums">{formatCurrency(stats?.expenses ?? 0)}</span></div>
            <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">Salary</span><span className="ml-auto font-semibold text-sky-400 tabular-nums">{formatCurrency(stats?.salary ?? 0)}</span></div>
            <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground font-medium">Net</span><span className={`ml-auto font-bold tabular-nums ${(stats?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(stats?.netProfit ?? 0)}</span></div>
          </div>
        </div>
      </div>

      {/* assigned vehicle footer */}
      {vehicle && (
        <div className="mx-5 mb-4 flex items-center gap-3 rounded-xl p-2.5 border border-white/[0.06]" style={{ background: hexToRgba('#3b82f6', 0.06) }}>
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Car className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{vehicle.make} {vehicle.model}</p>
            <p className="text-[11px] text-muted-foreground">{vehicle.plate_number}</p>
          </div>
        </div>
      )}

      <DriverEditModal open={editOpen} onOpenChange={setEditOpen} driver={driver} onSaved={onSave} />
    </div>
  );
}