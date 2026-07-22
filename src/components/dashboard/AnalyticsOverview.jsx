import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import CountUp from '@/components/common/CountUp';

const REVENUE_DATA = [
  { day: 'Mon', revenue: 0 },
  { day: 'Tue', revenue: 500 },
  { day: 'Wed', revenue: 1200 },
  { day: 'Thu', revenue: 800 },
  { day: 'Fri', revenue: 2500 },
  { day: 'Sat', revenue: 3100 },
  { day: 'Sun', revenue: 3121 },
];

const EXPENSE_DATA = [
  { name: 'Maintenance', value: 1, color: '#3b82f6' },
  { name: 'Fuel', value: 0, color: '#f97316' },
  { name: 'Trip Costs', value: 0, color: '#a855f7' },
  { name: 'Other', value: 0, color: '#22c55e' },
];

const expenseTotal = EXPENSE_DATA.reduce((s, d) => s + d.value, 0);

const GLASS = {
  background: 'linear-gradient(180deg, rgba(20,24,38,0.60) 0%, rgba(14,18,30,0.70) 100%)',
  backdropFilter: 'blur(20px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
  border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.30)',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(12,16,26,0.92)',
  border: '1px solid rgba(59,130,246,0.25)',
  borderRadius: 12,
  fontSize: 12,
  color: '#fff',
  backdropFilter: 'blur(12px)',
};

export default function AnalyticsOverview() {
  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Revenue trend */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={GLASS}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)' }} />
        <div className="absolute inset-x-0 top-0 h-16 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 60%)' }} />
        <h2 className="relative text-sm font-semibold text-white/80 mb-4">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)} />
            <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(59,130,246,0.3)' }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="url(#revGrad)"
              dot={{ r: 3, fill: '#fff', stroke: '#3b82f6', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(96,165,250,0.5))' }}
              isAnimationActive
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Expense breakdown donut */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={GLASS}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.3), transparent)' }} />
        <h2 className="relative text-sm font-semibold text-white/80 mb-4">Expense Breakdown</h2>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={EXPENSE_DATA}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={65}
                  paddingAngle={2}
                  startAngle={90}
                  isAnimationActive
                  animationDuration={1000}
                >
                  {EXPENSE_DATA.map((d) => (
                    <Cell key={d.name} fill={d.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase tracking-wider text-white/40">Total</span>
              <span className="text-lg font-bold text-white">
                <CountUp value={expenseTotal} decimals={2} prefix="AED " />
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            {EXPENSE_DATA.map((d) => {
              const pct = expenseTotal > 0 ? Math.round((d.value / expenseTotal) * 100) : 0;
              return (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}80` }} />
                  <span className="text-xs text-white/70 flex-1 truncate">{d.name}</span>
                  <span className="text-xs text-white/40 tabular-nums">{formatCurrency(d.value)}</span>
                  <span className="text-xs text-white/30 w-9 text-right tabular-nums">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}