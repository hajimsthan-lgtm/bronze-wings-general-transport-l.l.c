import { LineChart, Line, BarChart, Bar, AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, type = 'line', color = '#3b82f6', width = 80, height = 32 }) {
  const arr = (data && data.length ? data : [0, 0]).map((v, i) => ({ i, v: Number(v) || 0 }));
  const Comp = type === 'bar' ? BarChart : type === 'area' ? AreaChart : LineChart;
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Comp data={arr} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          {type === 'bar' ? (
            <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} isAnimationActive animationDuration={800} />
          ) : type === 'area' ? (
            <Area dataKey="v" stroke={color} fill={color} fillOpacity={0.18} strokeWidth={1.5} dot={false} isAnimationActive animationDuration={800} />
          ) : (
            <Line dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive animationDuration={800} />
          )}
        </Comp>
      </ResponsiveContainer>
    </div>
  );
}