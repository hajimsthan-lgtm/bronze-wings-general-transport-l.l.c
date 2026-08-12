import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { axisTick, axisTickSm, gridStroke, chartTooltipStyle, barCursorStyle } from './chartTheme';

export default function BarTrendChart({ data, dataKey = 'value', xKey = 'label', color = '#1ED760', height = 220, horizontal = false }) {
  const layout = horizontal ? 'vertical' : 'horizontal';
  const gid = `bar-${dataKey}-${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 10, right: 14, bottom: 4, left: horizontal ? 8 : -12 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2={horizontal ? 1 : 0} y2={horizontal ? 0 : 1}>
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={horizontal ? 0.55 : 0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} vertical={!horizontal} horizontal={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey={xKey} tick={axisTickSm} axisLine={false} tickLine={false} width={92} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={axisTick} axisLine={false} tickLine={false} dy={6} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={44} />
          </>
        )}
        <Tooltip contentStyle={chartTooltipStyle} cursor={barCursorStyle} />
        <Bar
          dataKey={dataKey}
          fill={`url(#${gid})`}
          radius={horizontal ? [6, 6, 6, 6] : [7, 7, 2, 2]}
          background={{ fill: 'rgba(255,255,255,0.035)', radius: 6 }}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
        >
          {data.map((_, i) => <Cell key={i} fill={`url(#${gid})`} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}