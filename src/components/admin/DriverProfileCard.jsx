import { Phone, Mail, MessageCircle, Truck, Wallet, Gauge, Calendar, FileText } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import FlipCard from '@/components/common/FlipCard';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

export default function DriverProfileCard({ driver, vehicle, stats }) {
  const accent = '#34d399';
  const statsList = [
    { label: 'Trips', value: stats?.trips ?? 0, icon: Truck, accent: '#3b82f6' },
    { label: 'Revenue', value: formatCurrency(stats?.revenue ?? 0), icon: Wallet, accent: '#34d399' },
    { label: 'Avg / Trip', value: formatCurrency(stats?.avgPerTrip ?? 0), icon: Gauge, accent: '#f59e0b' },
    { label: 'Experience', value: stats?.experience ?? '—', icon: Calendar, accent: '#a855f7' },
  ];
  const backRows = [
    { label: 'License #', value: driver.license_number },
    { label: 'License Expiry', value: formatDate(driver.license_expiry) },
    { label: 'Visa Expiry', value: formatDate(driver.visa_expiry) },
    { label: 'Nationality', value: driver.nationality },
    { label: 'Base Salary', value: formatCurrency(driver.base_salary) },
    { label: 'Join Date', value: formatDate(driver.join_date) },
    { label: 'Emergency', value: driver.emergency_contact },
  ];
  const chatHref = driver.email ? `mailto:${driver.email}` : (driver.phone ? `tel:${driver.phone}` : null);

  const front = (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba(accent, 0.5)} 0%, transparent 70%)` }} />
      <div className="relative flex items-start gap-4 pr-10">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-muted/40 flex items-center justify-center flex-shrink-0">
          {driver.image_url ? <img src={driver.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-white entity-avatar w-full h-full flex items-center justify-center">{initialsOf(driver.name)}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-foreground leading-tight">{driver.name}</h2>
            <StatusBadge status={driver.status} />
          </div>
          <div className="mt-1 space-y-0.5">
            {driver.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" /> {driver.phone}</p>}
            {driver.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate"><Mail className="w-3 h-3" /> {driver.email}</p>}
          </div>
        </div>
        {chatHref && (
          <a href={chatHref} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-foreground hover:bg-white/10 transition-colors flex-shrink-0">
            <MessageCircle className="w-3.5 h-3.5" /> Chat
          </a>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
        {statsList.map((s) => { const I = s.icon; return (
          <div key={s.label} className="rounded-xl p-2.5 border border-white/[0.06]" style={{ background: hexToRgba(s.accent, 0.06) }}>
            <div className="flex items-center gap-1.5 mb-1"><I className="w-3.5 h-3.5" style={{ color: s.accent }} /><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p></div>
            <p className="text-sm font-semibold text-foreground tabular-nums truncate">{s.value}</p>
          </div>
        ); })}
      </div>
      {vehicle && (
        <div className="mt-4 flex items-center gap-3 rounded-xl p-3 border border-white/[0.06]" style={{ background: hexToRgba('#3b82f6', 0.06) }}>
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Truck className="w-4 h-4 text-primary" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{vehicle.make} {vehicle.model}</p>
            <p className="text-xs text-muted-foreground">{vehicle.plate_number}</p>
          </div>
        </div>
      )}
    </div>
  );

  const back = (
    <div className="glass-card p-5 relative overflow-hidden min-h-full">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba('#a855f7', 0.5)} 0%, transparent 70%)` }} />
      <div className="relative flex items-center gap-2 mb-3 pr-10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba('#a855f7', 0.14), border: `1px solid ${hexToRgba('#a855f7', 0.3)}` }}><FileText className="w-4 h-4" style={{ color: '#a855f7' }} /></div>
        <h3 className="text-sm font-semibold text-foreground">License &amp; Details</h3>
      </div>
      <div className="relative space-y-2">
        {backRows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/[0.06]" style={{ background: hexToRgba('#ffffff', 0.03) }}>
            <span className="text-xs text-muted-foreground">{r.label}</span>
            <span className="text-sm font-semibold text-foreground text-right ml-2 truncate max-w-[60%]">{r.value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return <FlipCard front={front} back={back} />;
}