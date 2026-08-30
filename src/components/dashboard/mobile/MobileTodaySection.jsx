import { Link } from 'react-router-dom';
import { CalendarClock, FileWarning, FileText, ChevronRight } from 'lucide-react';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

export default function MobileTodaySection({ trips, invoices, documents }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const tripsToday = trips.filter((t) => t.trip_date === todayStr && t.status === 'scheduled').length;
  const invoicesDueToday = invoices.filter((i) => i.due_date === todayStr && i.status !== 'paid' && i.status !== 'cancelled').length;
  const docsThisWeek = documents.filter((d) => {
    const days = daysUntil(d.expiry_date);
    return days !== null && days >= 0 && days <= 7;
  }).length;

  const items = [
    { icon: CalendarClock, label: 'Trips today', value: tripsToday, color: '#fb923c', to: '/trips' },
    { icon: FileText, label: 'Invoices due today', value: invoicesDueToday, color: '#fbbf24', to: '/accounts/invoices' },
    { icon: FileWarning, label: 'Docs expiring this week', value: docsThisWeek, color: '#f59e0b', to: '/admin/documents' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[14px] font-bold text-foreground">Today</p>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {new Date().toLocaleDateString('en', { weekday: 'long' })}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              to={it.to}
              className="flex flex-col gap-1.5 p-3 rounded-2xl active:scale-[0.97] transition-transform"
              style={{
                background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.60) 0%, rgba(var(--surf-2-rgb),0.75) 100%)',
                border: '1px solid rgba(var(--panel-accent-rgb),0.10)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
              }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${it.color}1f`, border: `1px solid ${it.color}3a` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: it.color }} />
              </div>
              <p className="text-[18px] font-bold text-foreground tabular-nums leading-none">{it.value}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold leading-tight">{it.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}