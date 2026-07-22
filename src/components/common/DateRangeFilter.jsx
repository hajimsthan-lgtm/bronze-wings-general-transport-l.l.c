import { Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function DateRangeFilter({ fromValue, onFromChange, toValue, onToChange, onToday }) {
  const { t } = useI18n();
  return (
    <div className="clay rounded-2xl p-2.5 flex items-stretch gap-2 w-full">
      {/* From box */}
      <div className="clay-input rounded-xl px-3 py-2 flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-200/70" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t('from')}</span>
        </div>
        <input
          type="date"
          value={fromValue}
          onChange={(e) => onFromChange(e.target.value)}
          className="bg-transparent border-none text-sm text-foreground font-mono focus:outline-none date-input-clean w-full"
        />
      </div>

      <span className="self-center text-muted-foreground/40 text-sm">—</span>

      {/* To box */}
      <div className="clay-input rounded-xl px-3 py-2 flex-1 flex flex-col gap-1.5 min-w-0 ring-1 ring-cyan-300/15 shadow-[0_0_12px_rgba(125,211,252,0.08)]">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-200/80" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t('to')}</span>
        </div>
        <input
          type="date"
          value={toValue}
          onChange={(e) => onToChange(e.target.value)}
          className="bg-transparent border-none text-sm text-foreground font-mono focus:outline-none date-input-clean w-full"
        />
      </div>

      <button
        onClick={onToday}
        className="clay-chip clay-pressed rounded-full px-4 py-2 text-xs font-medium text-foreground whitespace-nowrap self-center ring-1 ring-cyan-300/15 shadow-[0_0_12px_rgba(125,211,252,0.1)] hover:text-cyan-200 transition-colors"
      >
        {t('today')}
      </button>
    </div>
  );
}