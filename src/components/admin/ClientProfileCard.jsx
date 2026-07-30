import { Phone, Mail, FileText, Receipt, Truck, Wallet, MapPin, Hash, CalendarClock, UserRound, Users } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const CLAY_SHADOW = '10px 10px 22px hsl(var(--clay-shadow-dark)), -10px -10px 22px hsl(var(--clay-shadow-light)), inset 0 1px 0 rgba(255,255,255,0.06)';
const CLAY_TILE_SHADOW = '5px 5px 12px hsl(var(--clay-shadow-dark)), -5px -5px 12px hsl(var(--clay-shadow-light)), inset 0 1px 0 rgba(255,255,255,0.05)';
const CLAY_INSET = 'inset 2px 2px 5px rgba(0,0,0,0.35), inset -2px -2px 5px rgba(255,255,255,0.04)';

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
      className="relative overflow-hidden rounded-[2rem] mb-4 animate-fade-in-up"
      style={{
        background: 'linear-gradient(160deg, hsl(var(--clay-bg)) 0%, hsl(228 22% 11%) 100%)',
        border: '1px solid hsl(var(--clay-border))',
        boxShadow: `${CLAY_SHADOW}, inset 0 0 50px rgba(var(--panel-accent-rgb),0.03)`,
      }}
    >
      {/* soft accent ambient blobs */}
      <div className="absolute -top-24 -left-10 w-72 h-72 rounded-full pointer-events-none opacity-25" style={{ background: `radial-gradient(circle, ${hexToRgba('#3b82f6', 0.45)} 0%, transparent 70%)` }} />
      <div className="absolute -bottom-28 -right-10 w-72 h-72 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba('#a855f7', 0.4)} 0%, transparent 70%)` }} />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-4 flex-wrap">
          {/* puffy clay avatar */}
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(160deg, hsl(var(--clay-bg)) 0%, hsl(228 22% 12%) 100%)',
              border: '1px solid hsl(var(--clay-border))',
              boxShadow: `8px 8px 18px hsl(var(--clay-shadow-dark)), -8px -8px 18px hsl(var(--clay-shadow-light)), inset 0 2px 5px rgba(255,255,255,0.07), 0 0 0 1px ${hexToRgba('#3b82f6', 0.18)}, 0 0 28px -8px ${hexToRgba('#3b82f6', 0.45)}`,
            }}
          >
            {client.image_url
              ? <img src={client.image_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-3xl font-bold text-foreground">{initialsOf(client.name)}</span>}
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
            {/* clay chip row */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {chips.map((c, i) => {
                const I = c.icon;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{
                      background: hexToRgba(c.accent, 0.10),
                      border: `1px solid ${hexToRgba(c.accent, 0.22)}`,
                      color: hexToRgba(c.accent, 0.95),
                      boxShadow: CLAY_INSET,
                    }}
                  >
                    <I className="w-3 h-3" /> {c.label ? `${c.label}: ` : ''}{c.value}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* puffy clay stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          {statsList.map((s) => {
            const I = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-2xl p-3.5 transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(160deg, hsl(var(--clay-bg)) 0%, hsl(228 22% 12%) 100%)',
                  border: '1px solid hsl(var(--clay-border))',
                  boxShadow: CLAY_TILE_SHADOW,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: hexToRgba(s.accent, 0.14),
                      border: `1px solid ${hexToRgba(s.accent, 0.28)}`,
                      boxShadow: CLAY_INSET,
                    }}
                  >
                    <I className="w-4 h-4" style={{ color: s.accent }} />
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