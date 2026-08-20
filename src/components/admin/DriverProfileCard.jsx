import { useState } from 'react';
import { Phone, Mail, BadgeCheck, ChevronDown, Wallet, ShieldCheck, Globe2, TrendingUp, FileText, Car, Pencil } from 'lucide-react';
import DriverEditModal from '@/components/admin/DriverEditModal';
import IconChip from '@/components/common/IconChip';
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

const STATUS_CONFIG = {
  active: { varName: 'success', label: 'Active' },
  inactive: { varName: 'muted-foreground', label: 'Inactive' },
  on_leave: { varName: 'warning', label: 'On Leave' },
};

function Row({ label, value, tone }) {
  const isEmpty = !value || value === '—';
  return (
    <div className="flex items-center justify-between gap-2 text-[13px] px-0.5 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium truncate text-right tabular-nums ${isEmpty ? 'text-muted-foreground/40' : (tone || 'text-foreground')}`}>{value || '—'}</span>
    </div>
  );
}

function AccordionItem({ sectionKey, openKey, setOpenKey, title, icon: Icon, accent, children }) {
  const open = openKey === sectionKey;
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-px hover:shadow-sm"
      style={{
        background: 'hsl(var(--muted) / 0.3)',
        borderLeft: open ? `2px solid ${accent}` : '2px solid transparent',
      }}
    >
      <button
        type="button"
        onClick={() => setOpenKey(open ? null : sectionKey)}
        className="w-full flex items-center gap-2.5 px-3 min-h-[48px] hover:bg-muted/40 transition-colors duration-200"
      >
        <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.14)}, ${hexToRgba(accent, 0.08)})`, border: `1px solid ${hexToRgba(accent, 0.25)}` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </span>
        <span className="text-sm font-medium text-foreground flex-1 text-left">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-1.5 space-y-1.5 border-t border-border/40">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function DriverProfileCard({ driver, vehicle, stats, onSave }) {
  const [editOpen, setEditOpen] = useState(false);
  const [openSection, setOpenSection] = useState('license');
  const stCfg = STATUS_CONFIG[driver.status] || STATUS_CONFIG.active;

  return (
    <div className="space-y-5">
      {/* ===== Identity Card — gradient wash + gradient border ===== */}
      <div className="glass-card grad-wash grad-card-border relative overflow-hidden animate-fade-in-up">
        <button
          onClick={() => setEditOpen(true)}
          aria-label="Edit driver"
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 active:scale-95"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 grad-avatar">
              {driver.image_url
                ? <img src={driver.image_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-lg font-medium text-white">{initialsOf(driver.name)}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-foreground leading-tight truncate">{driver.name}</h2>
                <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Transport Driver</p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, hsl(var(--${stCfg.varName}) / 0.15), hsl(var(--${stCfg.varName}) / 0.08))`,
                borderColor: `hsl(var(--${stCfg.varName}) / 0.25)`,
                color: `hsl(var(--${stCfg.varName}))`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: `hsl(var(--${stCfg.varName}))` }} />
              {stCfg.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border/50">
          {[
            { label: 'Trips', value: stats?.trips ?? 0 },
            { label: 'Revenue', value: formatCurrency(stats?.revenue ?? 0) },
            { label: 'Experience', value: stats?.experience ?? '—' },
          ].map((s) => (
            <div key={s.label} className="px-2 py-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground mb-1">{s.label}</p>
              <p className="text-[15px] font-bold text-foreground tabular-nums truncate">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-border/80 mx-6 my-4" />

        <div className="px-6 pb-5 space-y-3.5">
          {driver.phone && (
            <a href={`tel:${driver.phone}`} className="flex items-center gap-2.5 text-xs">
              <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Phone</span>
              <span className="ml-auto font-semibold text-foreground tabular-nums">{driver.phone}</span>
            </a>
          )}
          {driver.email && (
            <a href={`mailto:${driver.email}`} className="flex items-center gap-2.5 text-xs">
              <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Email</span>
              <span className="ml-auto font-semibold text-foreground truncate">{driver.email}</span>
            </a>
          )}
          <div className="flex items-center gap-2.5 text-xs">
            <Wallet className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Base Salary</span>
            <span className="ml-auto font-semibold text-foreground tabular-nums">{formatCurrency(driver.base_salary)}</span>
          </div>
        </div>

        {vehicle && (
          <div className="mx-6 mb-5 flex items-center gap-3 rounded-xl p-3 border border-border/50 bg-muted/20">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Car className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{vehicle.make} {vehicle.model}</p>
              <p className="text-xs text-muted-foreground">{vehicle.plate_number}</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== License & Details Card ===== */}
      <div className="glass-card animate-fade-in-up flex flex-col max-h-[calc(100vh-220px)]">
        <div className="flex items-center gap-2.5 p-6 pb-4 flex-shrink-0">
          <IconChip icon={FileText} accent="#a855f7" size={32} />
          <h3 className="text-[15px] font-semibold text-foreground">License &amp; Details</h3>
        </div>

        <div className="space-y-2.5 px-6 pb-6 overflow-y-auto thin-scroll">
          <AccordionItem sectionKey="license" openKey={openSection} setOpenKey={setOpenSection} title="License" icon={ShieldCheck} accent="#1ED760">
            <Row label="License #" value={driver.license_number} />
            <Row label="License Expiry" value={formatDate(driver.license_expiry)} tone={expiryTone(driver.license_expiry)} />
            <Row label="Visa Expiry" value={formatDate(driver.visa_expiry)} tone={expiryTone(driver.visa_expiry)} />
          </AccordionItem>
          <AccordionItem sectionKey="personal" openKey={openSection} setOpenKey={setOpenSection} title="Personal Details" icon={Globe2} accent="#a855f7">
            <Row label="Nationality" value={driver.nationality} />
            <Row label="Join Date" value={formatDate(driver.join_date)} />
            <Row label="Experience" value={stats?.experience} />
            <Row label="Emergency" value={driver.emergency_contact} />
          </AccordionItem>
          <AccordionItem sectionKey="salary" openKey={openSection} setOpenKey={setOpenSection} title="Base Salary" icon={Wallet} accent="#34d399">
            <Row label="Base Salary" value={formatCurrency(driver.base_salary)} />
            <Row label="Status" value={driver.status?.replace(/_/g, ' ')} />
          </AccordionItem>
          <AccordionItem sectionKey="profit" openKey={openSection} setOpenKey={setOpenSection} title="Profit Summary" icon={TrendingUp} accent="#f59e0b">
            <Row label="Trip Revenue" value={formatCurrency(stats?.revenue ?? 0)} tone="text-emerald-400" />
            <Row label="Expenses" value={formatCurrency(stats?.expenses ?? 0)} tone="text-amber-400" />
            <Row label="Salary" value={formatCurrency(stats?.salary ?? 0)} tone="text-sky-400" />
            <Row label="Net Profit" value={formatCurrency(stats?.netProfit ?? 0)} tone={(stats?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
          </AccordionItem>
        </div>
      </div>

      <DriverEditModal open={editOpen} onOpenChange={setEditOpen} driver={driver} onSaved={onSave} />
    </div>
  );
}