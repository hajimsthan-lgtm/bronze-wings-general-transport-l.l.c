import { Phone, Mail, FileText, Receipt, Truck, Wallet, MapPin, Hash, CalendarClock, UserRound, Users } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

export default function ClientProfileCard({ client, stats }) {
  const statsList = [
    { label: 'Trips', value: stats?.trips ?? 0, icon: Truck, accent: '#3b82f6' },
    { label: 'Invoices', value: stats?.invoices ?? 0, icon: FileText, accent: '#a855f7' },
    { label: 'Outstanding', value: stats?.outstanding ?? 0, icon: Receipt, accent: '#f43f5e' },
    { label: 'Paid', value: stats?.paid ?? 0, icon: Wallet, accent: '#34d399' },
  ];
  const chips = [
    { icon: Hash, value: client.trn, label: 'TRN', accent: '#a855f7' },
    { icon: CalendarClock, value: client.payment_terms, label: 'Terms', accent: '#f59e0b' },
    { icon: Users, value: client.contact_persons?.length ? `${client.contact_persons.length} contacts` : '', accent: '#3b82f6' },
    { icon: MapPin, value: client.address, label: 'Address', accent: '#f43f5e' },
  ].filter((c) => c.value);

  return (
    <div
      className="relative overflow-hidden rounded-3xl mb-4 animate-fade-in-up"
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(168,85,247,0.09) 50%, rgba(var(--surf-2-rgb),0.92) 100%)',
        border: '1px solid rgba(59,130,246,0.20)',
        boxShadow: '0 0 0 1px rgba(59,130,246,0.06), 0 0 60px -20px rgba(59,130,246,0.42), 0 24px 60px rgba(0,0,0,0.45)',
      }}
    >
      <div className="absolute -top-24 -left-10 w-72 h-72 rounded-full pointer-events-none opacity-30" style={{ background: `radial-gradient(circle, ${hexToRgba('#3b82f6', 0.5)} 0%, transparent 70%)` }} />
      <div className="absolute -bottom-28 -right-10 w-72 h-72 rounded-full pointer-events-none opacity-25" style={{ background: `radial-gradient(circle, ${hexToRgba('#a855f7', 0.45)} 0%, transparent 70%)` }} />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center flex-shrink-0 entity-avatar"
            style={{ boxShadow: '0 0 0 1px rgba(59,130,246,0.25), 0 0 30px -8px rgba(59,130,246,0.5)' }}
          >
            {client.image_url
              ? <img src={client.image_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-3xl font-bold">{initialsOf(client.name)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight tracking-tight">{client.name}</h1>
              <StatusBadge status={client.status} />
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {client.contact_person && <span className="text-xs text-muted-foreground flex items-center gap-1"><UserRound className="w-3 h-3" /> {client.contact_person}</span>}
              {client.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email}</span>}
              {client.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {chips.map((c, i) => {
                const I = c.icon;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ background: hexToRgba(c.accent, 0.10), border: `1px solid ${hexToRgba(c.accent, 0.25)}`, color: hexToRgba(c.accent, 0.95) }}
                  >
                    <I className="w-3 h-3" /> {c.label ? `${c.label}: ` : ''}{c.value}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          {statsList.map((s) => {
            const I = s.icon;
            return (
              <div key={s.label} className="rounded-2xl p-3 border border-white/[0.06]" style={{ background: hexToRgba(s.accent, 0.08) }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: hexToRgba(s.accent, 0.16), border: `1px solid ${hexToRgba(s.accent, 0.3)}` }}
                  >
                    <I className="w-3.5 h-3.5" style={{ color: s.accent }} />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}