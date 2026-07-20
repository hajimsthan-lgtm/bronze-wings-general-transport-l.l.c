import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TripProfitSummary({ trip }) {
  const { t } = useI18n();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trip?.vehicle_plate) { setLoading(false); return; }
    let cancelled = false;
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        const records = await base44.entities.Expense.filter({ vehicle_plate: trip.vehicle_plate });
        if (cancelled) return;
        const tripDate = new Date(trip.trip_date);
        const windowMs = 7 * 24 * 60 * 60 * 1000;
        const related = (records || []).filter(e => {
          if (!e.date) return false;
          return Math.abs(new Date(e.date) - tripDate) <= windowMs;
        });
        setExpenses(related);
      } catch {
        if (!cancelled) setExpenses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchExpenses();
    return () => { cancelled = true; };
  }, [trip]);

  const revenue = trip.revenue || 0;
  const fuelCost = trip.fuel_cost || 0;
  const tollCost = trip.toll_cost || 0;
  const otherCost = trip.other_cost || 0;
  const tripCosts = fuelCost + tollCost + otherCost;
  const assignedTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalCosts = tripCosts + assignedTotal;
  const profit = revenue - totalCosts;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const isProfit = profit >= 0;

  return (
    <div className="glass-card p-4 mb-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('trip_summary')}</h3>

      {/* Profit header */}
      <div className={`rounded-lg p-3 mb-4 ${isProfit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isProfit
              ? <TrendingUp className="w-4 h-4 text-emerald-400" />
              : <TrendingDown className="w-4 h-4 text-red-400" />}
            <span className="text-sm font-medium text-foreground">{t('net_profit')}</span>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(profit)}</p>
            {revenue > 0 && (
              <p className="text-xs text-muted-foreground">{margin.toFixed(1)}% {t('profit_margin')}</p>
            )}
          </div>
        </div>
        {revenue > 0 && (
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all ${isProfit ? 'bg-emerald-400' : 'bg-red-400'}`}
              style={{ width: `${Math.min(100, Math.abs(margin))}%` }}
            />
          </div>
        )}
      </div>

      {/* Revenue */}
      <div className="flex justify-between text-sm mb-3">
        <span className="text-muted-foreground">{t('total_revenue')}</span>
        <span className="text-foreground font-medium">{formatCurrency(revenue)}</span>
      </div>

      {/* Trip costs */}
      <div className="space-y-1.5 mb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('trip_costs')}</p>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('fuel')}</span>
          <span className="text-foreground">{formatCurrency(fuelCost)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Toll</span>
          <span className="text-foreground">{formatCurrency(tollCost)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Other</span>
          <span className="text-foreground">{formatCurrency(otherCost)}</span>
        </div>
      </div>

      {/* Assigned expenses */}
      <div className="space-y-1.5 mb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('assigned_expenses')}</p>
        {loading ? (
          <div className="w-full h-5 bg-muted/40 rounded animate-pulse" />
        ) : expenses.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t('no_assigned_expenses')}</p>
        ) : (
          expenses.map((e) => (
            <div key={e.id} className="flex justify-between text-sm gap-2">
              <span className="text-muted-foreground truncate">{e.description || e.category}</span>
              <span className="text-foreground flex-shrink-0">{formatCurrency(e.amount)}</span>
            </div>
          ))
        )}
      </div>

      {/* Total costs */}
      <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
        <span className="text-foreground">{t('total_costs')}</span>
        <span className="text-foreground">{formatCurrency(totalCosts)}</span>
      </div>
    </div>
  );
}