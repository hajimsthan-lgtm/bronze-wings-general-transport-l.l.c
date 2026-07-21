import { Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatDate } from '@/lib/formatters';

export default function DateRangeFilter({ fromValue, onFromChange, toValue, onToChange, onToday }) {
  const { t } = useI18n();
  return (
    <div className="flex px-3 h-11 w-full border border-white/10 bg-white/[0.03] py-1 shadow-sm backdrop-blur-sm transition-colors focus-visible:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50 clay-input rounded-xl pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
      <Calendar className="w-4 h-4 text-muted-foreground pointer-events-none flex-shrink-0" />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{t('from') || 'From'}</span>
        <input type="date" value={fromValue} onChange={(e) => onFromChange(e.target.value)} className="bg-transparent border-none text-sm text-foreground focus:outline-none date-input-clean" />
        {fromValue && <span className="text-[10px] text-muted-foreground/70 font-mono">{formatDate(fromValue)}</span>}
      </div>
      <span className="text-muted-foreground/40 text-xs">—</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{t('to') || 'To'}</span>
        <input type="date" value={toValue} onChange={(e) => onToChange(e.target.value)} className="bg-transparent border-none text-sm text-foreground focus:outline-none date-input-clean" />
        {toValue && <span className="text-[10px] text-muted-foreground/70 font-mono">{formatDate(toValue)}</span>}
      </div>
      <button onClick={onToday} className="ml-auto text-xs px-2.5 py-1 rounded-full transition-colors whitespace-nowrap bg-primary/15 text-primary border border-primary/20 hover:bg-primary/20">
        {t('today')}
      </button>
    </div>);

}