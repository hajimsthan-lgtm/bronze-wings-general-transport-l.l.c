import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

const RANGES = ['7D', '30D', '90D'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl bg-popover/95 backdrop-blur-xl border border-border/40 shadow-xl">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function CommandPerformance({ data, range, setRange }) {
  return (
    <div className="cmd-card animate-enter-up" style={{ animationDelay: '0.55s' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold">Performance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Revenue trend</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full bg-foreground/[0.04] border border-border/30">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                range === r ? 'brand-gradient-bg text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="perf-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#C9873B" />
                <stop offset="100%" stopColor="#0A84FF" />
              </linearGradient>
              <linearGradient id="perf-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#C9873B" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#C9873B" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 6" stroke="rgba(128,128,128,0.1)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} dy={8} />
            <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(10,132,255,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area dataKey="revenue" stroke="url(#perf-stroke)" fill="url(#perf-fill)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#0A84FF', stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}