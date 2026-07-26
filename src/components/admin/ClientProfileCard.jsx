import { Phone, Mail, Building2, FileText, Receipt, Truck, Wallet } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import FlipCard from '@/components/common/FlipCard';
import { formatCurrency } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

export default function ClientProfileCard({ client, stats }) {
  const accent = '#3b82f6';
  const statsList = [
    { label: 'Trips', value: stats?.trips ?? 0, icon: Truck, accent: '#3b82f6' },
    { label: 'Invoices', value: stats?.invoices ?? 0, icon: FileText, accent: '#a855f7' },
    { label: 'Outstanding', value: stats?.outstanding ?? 0, icon: Receipt, accent: '#f43f5e' },
    { label: 'Paid', value: stats?.paid ?? 0, icon: Wallet, accent: '#34d399' },
  ];
  const backRows = [
    { label: 'TRN', value: client.trn },
    { label: 'Payment Terms', value: client.payment_terms },
    { label: 'Email', value: client.email },
    { label: 'Phone', value: client.phone },
    { label: 'Address', value: client.address },
    { label: 'Contact Persons', value: String(client.contact_persons?.length || 0) },
  ];

  const front = (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba(accent, 0.5)} 0%, transparent 70%)` }} />
      <div className="relative flex items-start gap-4 pr-10">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-muted/40 flex items-center justify-center flex-shrink-0">
          {client.image_url ? <img src={client.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-white entity-avatar w-full h-full flex items-center justify-center">{initialsOf(client.name)}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-foreground leading-tight">{client.name}</h2>
            <StatusBadge status={client.status} />
          </div>
          {client.contact_person && <p className="text-xs text-muted-foreground mt-0.5">{client.contact_person}</p>}
          <div className="mt-1 space-y-0.5">
            {client.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate"><Mail className="w-3 h-3" /> {client.email}</p>}
            {client.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" /> {client.phone}</p>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
        {statsList.map((s) => { const I = s.icon; return (
          <div key={s.label} className="rounded-xl p-2.5 border border-white/[0.06]" style={{ background: hexToRgba(s.accent, 0.06) }}>
            <div className="flex items-center gap-1.5 mb-1"><I className="w-3.5 h-3.5" style={{ color: s.accent }} /><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p></div>
            <p className="text-sm font-semibold text-foreground tabular-nums truncate">{s.value}</p>
          </div>
        ); })}
      </div>
    </div>
  );

  const back = (
    <div className="glass-card p-5 relative overflow-hidden min-h-full">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba('#a855f7', 0.5)} 0%, transparent 70%)` }} />
      <div className="relative flex items-center gap-2 mb-3 pr-10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba('#a855f7', 0.14), border: `1px solid ${hexToRgba('#a855f7', 0.3)}` }}><Building2 className="w-4 h-4" style={{ color: '#a855f7' }} /></div>
        <h3 className="text-sm font-semibold text-foreground">Company Details</h3>
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