import { Phone, Mail, Building2, FileText, Receipt, Truck, Wallet } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const LUMINATE = {
  borderTop: '3px solid #3b82f6',
  boxShadow: '0 0 0 1px rgba(59,130,246,0.18), 0 0 44px -10px rgba(59,130,246,0.45), 0 20px 50px rgba(0,0,0,0.45)',
};

export default function ClientProfileCard({ client, stats }) {
  const statsList = [
    { label: 'Trips', value: stats?.trips ?? 0, icon: Truck, accent: '#3b82f6' },
    { label: 'Invoices', value: stats?.invoices ?? 0, icon: FileText, accent: '#a855f7' },
    { label: 'Outstanding', value: stats?.outstanding ?? 0, icon: Receipt, accent: '#f43f5e' },
    { label: 'Paid', value: stats?.paid ?? 0, icon: Wallet, accent: '#34d399' },
  ];
  const detailRows = [
    { label: 'TRN', value: client.trn },
    { label: 'Payment Terms', value: client.payment_terms },
    { label: 'Email', value: client.email },
    { label: 'Phone', value: client.phone },
    { label: 'Address', value: client.address },
    { label: 'Contact Persons', value: String(client.contact_persons?.length || 0) },
  ];

  return (
    <div className="glass-card p-5 relative overflow-hidden animate-border-pulse mb-4" style={LUMINATE}>
      <div className="absolute -top-20 -left-10 w-56 h-56 rounded-full pointer-events-none opacity-30" style={{ background: `radial-gradient(circle, ${hexToRgba('#3b82f6', 0.45)} 0%, transparent 70%)` }} />
      <div className="absolute -bottom-24 -right-10 w-56 h-56 rounded-full pointer-events-none opacity-25" style={{ background: `radial-gradient(circle, ${hexToRgba('#a855f7', 0.40)} 0%, transparent 70%)` }} />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left — identity & stats */}
        <div>
          <div className="flex items-start gap-4">
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

        {/* Right — company details */}
        <div className="lg:border-l lg:border-white/10 lg:pl-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba('#a855f7', 0.14), border: `1px solid ${hexToRgba('#a855f7', 0.3)}` }}><Building2 className="w-4 h-4" style={{ color: '#a855f7' }} /></div>
            <h3 className="text-sm font-semibold text-foreground">Company Details</h3>
          </div>
          <div className="space-y-2">
            {detailRows.map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/[0.06]" style={{ background: hexToRgba('#ffffff', 0.03) }}>
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className="text-sm font-semibold text-foreground text-right ml-2 truncate max-w-[60%]">{r.value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}