import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const tooltipStyle = {
  background: 'rgba(12,16,26,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 12,
};

export default function BarTrendChart({ data, dataKey = 'value', xKey = 'label', color = '#3b82f6', height = 220, horizontal = false }) {
  const layout = horizontal ? 'vertical' : 'horizontal';
  const gid = `bar-${dataKey}-${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 8, bottom: 0, left: horizontal ? 8 : -16 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.95} />
            <stop offset="100%" stopColor={color} stopOpacity={0.45} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={!horizontal} horizontal={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey={xKey} tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
          </>
        )}
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey={dataKey} fill={`url(#${gid})`} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} isAnimationActive animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}