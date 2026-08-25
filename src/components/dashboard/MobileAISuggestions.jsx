import { Link } from 'react-router-dom';
import {
  Sparkles, AlertTriangle, TrendingDown, Wrench, Fuel, PiggyBank, ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

/**
 * "Suggested Management" section — AI-powered recommendations.
 * Generates suggestions from fleet data: overdue invoices, maintenance, fuel ratio, cash flow.
 */
export default function MobileAISuggestions({
  invoices, expenses, trips, overdueCount, maintenanceCount,
  netBalance, totalWithdrawals, totalRevenue,
}) {
  const suggestions = [];

  // 1. Overdue invoices follow-up
  if (overdueCount > 0) {
    const overdueAmt = invoices
      .filter((i) => i.status === 'overdue')
      .reduce((s, i) => s + ((Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0)), 0);
    suggestions.push({
      icon: AlertTriangle,
      iconColor: '#ef4444',
      iconBg: 'rgba(239,68,68,0.15)',
      title: 'Follow up overdue invoices',
      desc: `${overdueCount} overdue invoice${overdueCount !== 1 ? 's' : ''} totaling ${formatCurrency(overdueAmt)} — prioritize collection.`,
      badge: 'AI Alert',
      badgeColor: '#ef4444',
      action: 'Review',
      link: '/accounts/invoices',
    });
  }

  // 2. Maintenance scheduling
  if (maintenanceCount > 0) {
    suggestions.push({
      icon: Wrench,
      iconColor: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.15)',
      title: 'Schedule vehicle maintenance',
      desc: `${maintenanceCount} vehicle${maintenanceCount !== 1 ? 's' : ''} need maintenance — avoid breakdowns and revenue loss.`,
      badge: 'Action',
      badgeColor: '#f59e0b',
      action: 'Schedule',
      link: '/admin/vehicles',
    });
  }

  // 3. Fuel cost optimization
  const fuelTotal = expenses.filter((e) => e.category === 'fuel').reduce((s, e) => s + (Number(e.total_with_vat) || Number(e.amount) || 0), 0);
  if (totalRevenue > 0 && fuelTotal / totalRevenue > 0.15) {
    const pct = Math.round((fuelTotal / totalRevenue) * 100);
    suggestions.push({
      icon: Fuel,
      iconColor: '#10b981',
      iconBg: 'rgba(16,185,129,0.15)',
      title: 'Optimize fuel spending',
      desc: `Fuel is ${pct}% of revenue (${formatCurrency(fuelTotal)}). Consider route optimization or bulk fuel contracts.`,
      badge: 'AI Insight',
      badgeColor: '#10b981',
      action: 'Analyze',
      link: '/fuel',
    });
  }

  // 4. Cash flow warning
  if (netBalance < 0 && totalWithdrawals > 0) {
    suggestions.push({
      icon: TrendingDown,
      iconColor: '#ef4444',
      iconBg: 'rgba(239,68,68,0.15)',
      title: 'Negative cash flow detected',
      desc: `Withdrawals exceed deposits by ${formatCurrency(Math.abs(netBalance))}. Review pending payments and expenses.`,
      badge: 'AI Alert',
      badgeColor: '#ef4444',
      action: 'Review',
      link: '/reports/pnl',
    });
  }

  // 5. Petty cash / savings opportunity
  if (netBalance > 0 && totalRevenue > 0) {
    const savingsPct = Math.round((netBalance / Math.max(totalRevenue, 1)) * 100);
    if (savingsPct > 20) {
      suggestions.push({
        icon: PiggyBank,
        iconColor: '#a855f7',
        iconBg: 'rgba(168,85,247,0.15)',
        title: 'Surplus cash available',
        desc: `Net balance is ${savingsPct}% of revenue. Consider allocating to reserves or vendor prepayments.`,
        badge: 'AI Suggestion',
        badgeColor: '#a855f7',
        action: 'Review',
        link: '/accounts/petty-cash',
      });
    }
  }

  // Fallback positive suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      icon: Sparkles,
      iconColor: 'rgb(var(--panel-accent2-rgb))',
      iconBg: 'rgba(var(--panel-accent-rgb),0.15)',
      title: 'Fleet operations on track',
      desc: 'No urgent actions detected. Keep monitoring trips and expenses for optimization opportunities.',
      badge: 'AI Insight',
      badgeColor: 'rgb(var(--panel-accent2-rgb))',
      action: 'Dashboard',
      link: '/',
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4" style={{ color: 'rgb(var(--panel-accent2-rgb))' }} />
        <p className="text-sm font-semibold text-white">Suggested Management</p>
      </div>
      <div className="space-y-3">
        {suggestions.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link
              key={i}
              to={s.link}
              className="glass-card p-4 flex items-start gap-3 active:scale-[0.99] transition-transform"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: s.iconBg, border: `1px solid ${s.iconColor}33` }}
              >
                <Icon className="w-5 h-5" style={{ color: s.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-white flex-1 truncate">{s.title}</p>
                  <span
                    className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: `${s.badgeColor}22`, color: s.badgeColor }}
                  >
                    {s.badge}
                  </span>
                </div>
                <p className="text-[11px] text-white/55 leading-relaxed">{s.desc}</p>
                <div className="flex items-center gap-1 mt-2" style={{ color: s.badgeColor }}>
                  <span className="text-[11px] font-semibold">{s.action}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}