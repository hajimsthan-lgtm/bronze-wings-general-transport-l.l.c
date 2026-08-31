import { useNavigate, useLocation } from 'react-router-dom';
import { Route, Wrench, Fuel as FuelIcon, Receipt, Wallet } from 'lucide-react';

const TABS = [
  { label: 'Trips', path: '/trips', icon: Route },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench },
  { label: 'Fuel', path: '/fuel', icon: FuelIcon },
  { label: 'Expenses', path: '/expenses', icon: Receipt },
  { label: 'Salary', path: '/salary', icon: Wallet },
];

export default function OperationsTabSeparator({ activePath }) {
  const navigate = useNavigate();
  const location = useLocation();
  const current = activePath || location.pathname;

  return (
    <div className="flex bg-muted/40 rounded-xl p-1 overflow-x-auto no-scrollbar gap-1">
      {TABS.map((t) => {
        const isActive = current === t.path || current.startsWith(t.path + '/');
        const Icon = t.icon;
        return (
          <button
            key={t.label}
            onClick={() => navigate(t.path)}
            className={`inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}