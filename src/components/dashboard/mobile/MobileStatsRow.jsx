import { Link } from 'react-router-dom';
import { Route, FileText, CheckCircle2, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function MobileStatsRow({ totalTrips, pendingInvoices, completedTrips, dueAmount }) {
  const tiles = [
    { icon: Route, value: totalTrips, label: 'Trips', color: '#fb923c', to: '/trips' },
    { icon: FileText, value: pendingInvoices, label: 'Pending', color: '#fbbf24', to: '/accounts/invoices' },
    { icon: CheckCircle2, value: completedTrips, label: 'Done', color: '#22c55e', to: '/trips' },
    { icon: Wallet, value: formatCurrency(dueAmount), label: 'Outstanding', color: '#06b6d4', to: '/accounts/invoices', isCurrency: true },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <Link
            key={t.label}
            to={t.to}
            className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl active:scale-[0.97] transition-transform"
            style={{
              background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.60) 0%, rgba(var(--surf-2-rgb),0.75) 100%)',
              border: '1px solid rgba(var(--panel-accent-rgb),0.10)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${t.color}1f`, border: `1px solid ${t.color}3a` }}>
              <Icon className="w-3.5 h-3.5" style={{ color: t.color }} />
            </div>
            <p className={`font-bold text-foreground tabular-nums leading-none ${t.isCurrency ? 'text-[11px]' : 'text-[17px]'}`}>
              {t.value}
            </p>
            <p className="text-[8.5px] uppercase tracking-wider text-muted-foreground font-semibold">{t.label}</p>
          </Link>
        );
      })}
    </div>
  );
}