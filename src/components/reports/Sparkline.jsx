import { LineChart, Line, BarChart, Bar, AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, type = 'line', color = '#1ED760', width = 80, height = 32 }) {
  const arr = (data && data.length ? data : [0, 0]).map((v, i) => ({ i, v: Number(v) || 0 }));
  const Comp = type === 'bar' ? BarChart : type === 'area' ? AreaChart : LineChart;
  const gid = `spark-${type}-${color.replace('#', '')}`;
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Comp data={arr} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id={`${gid}-bar`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.45} />
            </linearGradient>
          </defs>
          {type === 'bar' ? (
            <Bar dataKey="v" fill={`url(#${gid}-bar)`} radius={[2, 2, 0, 0]} isAnimationActive animationDuration={800} />
          ) : type === 'area' ? (
            <Area dataKey="v" stroke={color} fill={`url(#${gid}-fill)`} strokeWidth={1.8} dot={false} isAnimationActive animationDuration={800} />
          ) : (
            <Line dataKey="v" stroke={color} strokeWidth={1.8} dot={false} isAnimationActive animationDuration={800} />
          )}
        </Comp>
      </ResponsiveContainer>
    </div>
  );
}