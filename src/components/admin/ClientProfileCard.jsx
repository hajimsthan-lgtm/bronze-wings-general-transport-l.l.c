import { Phone, Mail, Building2, BadgeCheck, Hash, CalendarClock, MapPin, Users, UserRound, Wallet, FileText, Receipt, Truck, Pencil } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const CARD_BASE = {
  ['--row-accent']: '#1ED760',
  borderTop: '3px solid #1ED760',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 18px rgba(0,0,0,0.3)',
};

export default function ClientProfileCard({ client, stats, onEditContacts }) {
  const isActive = client.status === 'active';
  const dotColor = isActive ? '#34d399' : '#94a3b8';

  const statsList = [
    { label: 'Trips', value: stats?.trips ?? 0, accent: '#1ED760' },
    { label: 'Invoices', value: stats?.invoices ?? 0, accent: '#a855f7' },
    { label: 'Outstanding', value: stats?.outstanding ?? 0, accent: '#f43f5e' },
    { label: 'Paid', value: stats?.paid ?? 0, accent: '#34d399' },
  ];

  return (
    <div className="glass-card relative overflow-hidden row-edge-glow animate-fade-in-up" style={CARD_BASE}>
      {/* header band */}
      <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${hexToRgba('#1ED760', 0.10)} 0%, transparent 100%)` }}>
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-25" style={{ background: `radial-gradient(circle, ${hexToRgba('#1ED760', 0.5)} 0%, transparent 70%)` }} />
        <div className="relative flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 rounded-xl animate-halo pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(30,215,96,0.40) 0%, transparent 70%)' }} />
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-muted/40 flex items-center justify-center">
              {client.image_url
                ? <img src={client.image_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-xl font-bold text-white entity-avatar w-full h-full flex items-center justify-center">{initialsOf(client.name)}</span>}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-foreground leading-tight truncate">{client.name}</h2>
              <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex w-2 h-2">
                {isActive && <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: dotColor }} />}
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: dotColor }} />
              </span>
              <span className="text-xs text-muted-foreground">Business Client</span>
            </div>
          </div>
          {onEditContacts && (
            <button onClick={onEditContacts} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Manage contacts">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <StatusBadge status={client.status} />
        </div>
      </div>

      {/* inline stats strip */}
      <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
        {statsList.map((s) => (
          <div key={s.label} className="px-1.5 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{s.label}</p>
            <p className="text-sm font-semibold tabular-nums truncate" style={{ color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* info rows */}
      <div className="px-5 py-4 space-y-2.5">
        {client.contact_person && (
          <div className="flex items-center gap-2.5 text-xs">
            <UserRound className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Contact</span>
            <span className="ml-auto font-semibold text-foreground truncate">{client.contact_person}</span>
          </div>
        )}
        {client.phone && (
          <a href={`tel:${client.phone}`} className="flex items-center gap-2.5 text-xs hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors">
            <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Phone</span>
            <span className="ml-auto font-semibold text-foreground truncate">{client.phone}</span>
          </a>
        )}
        {client.email && (
          <a href={`mailto:${client.email}`} className="flex items-center gap-2.5 text-xs hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors">
            <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Email</span>
            <span className="ml-auto font-semibold text-foreground truncate">{client.email}</span>
          </a>
        )}
        {client.trn && (
          <div className="flex items-center gap-2.5 text-xs">
            <Hash className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="text-muted-foreground">TRN</span>
            <span className="ml-auto font-semibold text-foreground truncate">{client.trn}</span>
          </div>
        )}
        {client.payment_terms && (
          <div className="flex items-center gap-2.5 text-xs">
            <CalendarClock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-muted-foreground">Terms</span>
            <span className="ml-auto font-semibold text-foreground truncate">{client.payment_terms}</span>
          </div>
        )}
        {client.contact_persons?.length > 0 && (
          <div className="pt-2.5 mt-1 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Contact Persons</span>
            </div>
            <div className="space-y-1.5">
              {client.contact_persons.map((cp, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-sky-300">{initialsOf(cp.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-foreground truncate block leading-tight">{cp.name}</span>
                    {cp.position && <span className="text-[10px] text-muted-foreground truncate block leading-tight">{cp.position}</span>}
                  </div>
                  {cp.phone && <a href={`tel:${cp.phone}`} onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary flex-shrink-0"><Phone className="w-3 h-3" /></a>}
                  {cp.email && <a href={`mailto:${cp.email}`} onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary flex-shrink-0"><Mail className="w-3 h-3" /></a>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* address footer */}
      {client.address && (
        <div className="mx-5 mb-5 flex items-start gap-2.5 rounded-xl p-3 border border-white/[0.06]" style={{ background: hexToRgba('#f43f5e', 0.06) }}>
          <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">{client.address}</p>
        </div>
      )}
    </div>
  );
}