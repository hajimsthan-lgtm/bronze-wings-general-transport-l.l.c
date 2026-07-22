import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

export default function DonutChart({ data, total, height = 200 }) {
  const inner = Math.max(height / 2 - 16, 10);
  const outer = Math.max(height / 2 - 4, 12);
  return (
    <div className="relative" style={{ width: height, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={inner}
            outerRadius={outer}
            paddingAngle={2}
            stroke="none"
            isAnimationActive
            animationDuration={1000}
          >
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'rgba(12,16,26,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12 }}
            formatter={(v) => formatCurrency(v)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-wider text-white/40">Total</span>
        <span className="text-sm font-bold text-white/90 tabular-nums">{total}</span>
      </div>
    </div>
  );
}