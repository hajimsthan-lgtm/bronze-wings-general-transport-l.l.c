import { motion } from 'framer-motion';

const BARS = [
  { label: 'Finance App design', pct: 78, color: '#ef4444' },
  { label: 'Ace website', pct: 63, color: '#3b82f6' },
  { label: 'Ace logo', pct: 36, color: '#f59e0b' },
];

export default function ProgressPanel() {
  return (
    <div className="rounded-[20px] p-5 h-full flex flex-col" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h3 className="text-white font-semibold text-[15px] mb-5">Progress</h3>
      <div className="space-y-5 flex-1 flex flex-col justify-center">
        {BARS.map((b, i) => (
          <div key={b.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">{b.label}</span>
              <span className="text-sm font-semibold text-white tabular-nums">{b.pct}%</span>
            </div>
            <div className="h-3 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${b.pct}%` }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                className="h-full rounded-md"
                style={{ background: `linear-gradient(90deg, ${b.color}, ${b.color}88)` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}