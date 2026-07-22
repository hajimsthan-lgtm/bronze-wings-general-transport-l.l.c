import { Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function DateRangeFilter({ fromValue, onFromChange, toValue, onToChange, onToday }) {
  const { t } = useI18n();
  return (
    <div
      className="rounded-2xl p-2.5 flex items-stretch gap-2 w-full"
      style={{
        background: 'rgba(18,22,34,0.50)',
        backdropFilter: 'blur(20px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.1)',
        border: '1px solid rgba(59,130,246,0.10)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* From box */}
      <div
        className="rounded-xl px-3 py-2 flex-1 flex flex-col gap-1.5 min-w-0 transition-colors hover:border-blue-500/25"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400/70" />
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">{t('from')}</span>
        </div>
        <input
          type="date"
          value={fromValue}
          onChange={(e) => onFromChange(e.target.value)}
          className="bg-transparent border-none text-sm text-white/90 font-mono focus:outline-none date-input-clean w-full"
        />
      </div>

      <span className="self-center text-white/20 text-sm">—</span>

      {/* To box */}
      <div
        className="rounded-xl px-3 py-2 flex-1 flex flex-col gap-1.5 min-w-0 transition-colors hover:border-blue-500/25"
        style={{
          background: 'rgba(59,130,246,0.05)',
          border: '1px solid rgba(59,130,246,0.15)',
          boxShadow: '0 0 12px rgba(59,130,246,0.06)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400/80" />
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">{t('to')}</span>
        </div>
        <input
          type="date"
          value={toValue}
          onChange={(e) => onToChange(e.target.value)}
          className="bg-transparent border-none text-sm text-white/90 font-mono focus:outline-none date-input-clean w-full"
        />
      </div>

      <button
        onClick={onToday}
        className="rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap self-center transition-all duration-200 hover:shadow-[0_0_14px_rgba(59,130,246,0.35)]"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(37,99,235,0.10) 100%)',
          border: '1px solid rgba(59,130,246,0.25)',
          color: '#93c5fd',
        }}
      >
        {t('today')}
      </button>
    </div>
  );
}