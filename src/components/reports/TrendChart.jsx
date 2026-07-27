import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { axisTick, gridStroke, chartTooltipStyle, cursorStyle } from './chartTheme';

export default function TrendChart({ data, series, height = 220, type = 'area', xKey = 'label' }) {
  const Comp = type === 'line' ? LineChart : AreaChart;
  const gid = (s) => `trend-${s.key}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Comp data={data} margin={{ top: 10, right: 14, bottom: 4, left: -12 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={`f-${s.key}`} id={`${gid(s)}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
              <stop offset="55%" stopColor={s.color} stopOpacity={0.14} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
            </linearGradient>
          ))}
          {series.map((s) => (
            <linearGradient key={`s-${s.key}`} id={`${gid(s)}-stroke`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.65} />
              <stop offset="50%" stopColor={s.color} stopOpacity={1} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.65} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} vertical={false} />
        <XAxis dataKey={xKey} tick={axisTick} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={44} />
        <Tooltip contentStyle={chartTooltipStyle} cursor={cursorStyle} />
        {type === 'area'
          ? series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={`url(#${gid(s)}-stroke)`}
                fill={`url(#${gid(s)}-fill)`}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4.5, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive
                animationDuration={1100}
                animationEasing="ease-out"
              />
            ))
          : series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={`url(#${gid(s)}-stroke)`}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4.5, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive
                animationDuration={1100}
                animationEasing="ease-out"
              />
            ))}
      </Comp>
    </ResponsiveContainer>
  );
}