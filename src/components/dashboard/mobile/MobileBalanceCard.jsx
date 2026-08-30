import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

export default function MobileBalanceCard({ finance }) {
  const [expanded, setExpanded] = useState(false);
  const { netBalance, deposits, withdrawals, dailySeries, incomeBreakdown, outflowBreakdown } = finance;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => setExpanded((v) => !v)}
      className="rounded-[20px] p-5 relative overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(140deg, rgba(var(--panel-accent-rgb),0.28) 0%, rgba(var(--surf-2-rgb),0.92) 55%)',
        border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 12px 36px rgba(0,0,0,0.30)',
      }}
    >
      <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(var(--panel-accent-rgb),0.20), transparent 70%)' }} />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(145deg, rgba(var(--panel-accent-rgb),0.35), rgba(var(--panel-accent-rgb),0.12))', border: '1px solid rgba(var(--panel-accent-rgb),0.35)' }}>
            <Wallet className="w-4 h-4" style={{ color: 'rgb(var(--panel-accent2-rgb))' }} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em] font-bold text-white/45">Fleet Account</p>
            <p className="text-[11px] font-medium text-white/75">Net Cash Balance</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Balance + sparkline */}
      <div className="relative flex items-end justify-between gap-3 mt-3">
        <p className="text-[32px] font-bold text-white tabular-nums leading-none" style={{ fontFamily: 'var(--font-display)' }}>
          {formatCurrency(netBalance)}
        </p>
        <div className="flex-1 max-w-[140px] h-12 opacity-90">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySeries} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="mobileBalanceSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--panel-accent2-rgb))" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="rgb(var(--panel-accent2-rgb))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="rgb(var(--panel-accent2-rgb))" strokeWidth={2} fill="url(#mobileBalanceSpark)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="relative flex items-center gap-4 mt-2.5">
        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> {formatCurrency(deposits)}
        </span>
        <span className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
          <TrendingDown className="w-3 h-3" /> {formatCurrency(withdrawals)}
        </span>
      </div>

      {/* Tap-to-expand breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden"
          >
            <div className="pt-4 mt-3 border-t border-white/10 grid grid-cols-2 gap-x-4 gap-y-2.5">
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-wider text-emerald-400/80 font-bold">Income</p>
                {incomeBreakdown.length === 0 && <p className="text-[11px] text-white/40">None</p>}
                {incomeBreakdown.map((it) => (
                  <div key={it.label} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] text-white/70 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.color }} />
                      <span className="truncate">{it.label}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-white tabular-nums">{formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-wider text-red-400/80 font-bold">Outflow</p>
                {outflowBreakdown.length === 0 && <p className="text-[11px] text-white/40">None</p>}
                {outflowBreakdown.map((it) => (
                  <div key={it.label} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] text-white/70 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.color }} />
                      <span className="truncate">{it.label}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-white tabular-nums">{formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}