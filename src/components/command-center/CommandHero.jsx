import { useNavigate } from 'react-router-dom';
import { Plus, Receipt, UserPlus, Fuel, FileText } from 'lucide-react';

export default function CommandHero({ userName }) {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const actions = [
    { icon: Plus, label: 'New Trip', path: '/trips', brand: true },
    { icon: Receipt, label: 'Add Expense', path: '/expenses' },
    { icon: UserPlus, label: 'Add Driver', path: '/admin/drivers' },
    { icon: Fuel, label: 'Fuel Entry', path: '/fuel' },
    { icon: FileText, label: 'New Invoice', path: '/accounts/invoices' },
  ];

  return (
    <div className="relative overflow-hidden cmd-card animate-enter-up" style={{ animationDelay: '0.05s' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 60% 80% at 20% 0%, rgba(0,242,195,0.10), transparent 70%),
                     radial-gradient(ellipse 50% 70% at 80% 100%, rgba(34,211,238,0.08), transparent 70%)`
      }} />
      <div className="relative">
        <h1 className="text-3xl xl:text-4xl font-bold tracking-tight">
          <span className="brand-gradient-text">{greeting}, {userName}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">Here's your fleet command overview for today.</p>
        <div className="flex flex-wrap gap-3 mt-5">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-foreground/[0.04] border border-border/40 hover:border-[rgba(0,242,195,0.4)] hover:bg-foreground/[0.06] hover:shadow-[0_0_20px_-6px_rgba(0,242,195,0.3)] transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 ${a.brand ? 'brand-gradient-bg' : 'bg-foreground/10'}`}>
                  <Icon className={`w-4 h-4 ${a.brand ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <span className="text-sm font-medium">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}