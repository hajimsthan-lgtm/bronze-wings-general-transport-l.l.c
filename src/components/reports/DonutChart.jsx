import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { chartTooltipStyle } from './chartTheme';

export default function DonutChart({ data, total, height = 200 }) {
  const inner = Math.max(height / 2 - 18, 10);
  const outer = Math.max(height / 2 - 4, 12);
  return (
    <div className="relative" style={{ width: height, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {data.map((d, i) => (
              <radialGradient key={i} id={`donut-${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor={d.color} stopOpacity={0.85} />
                <stop offset="100%" stopColor={d.color} stopOpacity={1} />
              </radialGradient>
            ))}
          </defs>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={inner}
            outerRadius={outer}
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
            isAnimationActive
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(v, n) => [formatCurrency(v), n]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-[0.12em] text-white/40">Total</span>
        <span className="text-base font-bold text-white/90 tabular-nums mt-0.5">{total}</span>
      </div>
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: `inset 0 0 24px rgba(255,255,255,0.04)` }} />
    </div>
  );
}