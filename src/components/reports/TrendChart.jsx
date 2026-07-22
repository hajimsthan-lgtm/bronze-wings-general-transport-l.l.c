import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { hexToRgba } from './ReportStatCard';

const tooltipStyle = {
  background: 'rgba(12,16,26,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 12,
};

export default function TrendChart({ data, series, height = 220, type = 'area', xKey = 'label' }) {
  const Comp = type === 'line' ? LineChart : AreaChart;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Comp data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
        {type === 'area'
          ? series.map((s) => (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} fill={`url(#grad-${s.key})`} strokeWidth={2} dot={false} isAnimationActive animationDuration={1000} />
            ))
          : series.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} isAnimationActive animationDuration={1000} />
            ))}
      </Comp>
    </ResponsiveContainer>
  );
}