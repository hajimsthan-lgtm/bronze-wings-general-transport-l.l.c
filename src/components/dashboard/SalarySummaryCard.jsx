import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatters';
import { Wallet, TrendingDown, PiggyBank, ArrowRight, Users } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CARD = {
  background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.72) 0%, rgba(var(--surf-2-rgb),0.86) 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
};

export default function SalarySummaryCard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const now = new Date();
    const month = MONTHS[now.getMonth()];
    const year = now.getFullYear();
    Promise.all([
      base44.entities.SalaryRecord.list('-created_date', 200).catch(() => []),
      base44.entities.DriverDeduction.filter({ status: 'active' }).catch(() => []),
      base44.entities.Driver.list().catch(() => []),
    ]).then(([records, deductions, drivers]) => {
      const recs = (records || []).filter((r) => r.year === year && r.month === month);
      const totalBase = recs.reduce((s, r) => s + (Number(r.base_salary) || 0), 0);
      const totalDeductions = recs.reduce((s, r) => s + (Number(r.deductions) || 0), 0);
      const totalNet = recs.reduce((s, r) => s + (Number(r.net_salary) || 0), 0);
      const activeMonthly = (deductions || []).reduce((s, d) => s + (Number(d.monthly_deduction) || 0), 0);
      setData({ month, year, totalBase, totalDeductions, totalNet, activeMonthly, count: recs.length, driverCount: (drivers || []).length });
    });
  }, []);

  if (!data) return <div className="rounded-3xl p-5 sm:p-6 animate-pulse" style={{ ...CARD, height: 180 }} />;

  const dedPct = data.totalBase > 0 ? Math.min(100, (data.totalDeductions / data.totalBase) * 100) : 0;

  return (
    <div className="rounded-3xl p-5 sm:p-6" style={CARD}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-semibold text-white">Salary Summary</h2>
          <span className="text-xs text-white/40 ml-1">{data.month} {data.year}</span>
        </div>
        <Link to="/admin/salary" className="inline-flex items-center gap-1 text-[13px] font-medium hover:opacity-80" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold flex items-center gap-1"><Wallet className="w-3 h-3" /> Base Salary</p>
          <p className="text-xl font-bold text-white tabular-nums mt-1">{formatCurrency(data.totalBase)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Deductions</p>
          <p className="text-xl font-bold text-red-400 tabular-nums mt-1">{formatCurrency(data.totalDeductions)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold flex items-center gap-1"><PiggyBank className="w-3 h-3" /> Net Pay</p>
          <p className="text-xl font-bold text-emerald-400 tabular-nums mt-1">{formatCurrency(data.totalNet)}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[11px] text-white/50 mb-1.5">
          <span>Deductions vs Base</span>
          <span className="tabular-nums">{dedPct.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${dedPct}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)', boxShadow: '0 0 8px rgba(239,68,68,0.4)' }} />
        </div>
        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-white/50 flex items-center gap-1.5"><Users className="w-3 h-3" /> {data.count} payslips · {data.driverCount} drivers</span>
          <span className="text-white/40">Active deductions: <span className="text-amber-400 font-semibold tabular-nums">{formatCurrency(data.activeMonthly)}/mo</span></span>
        </div>
      </div>
    </div>
  );
}