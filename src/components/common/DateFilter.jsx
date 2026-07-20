import { Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * Reusable date filter with custom SVG calendar icon overlay.
 * Hides the native browser picker indicator for a polished look.
 * Includes a Today / All Dates toggle.
 */
export default function DateFilter({ value, onChange, showAll, onToggleAll }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 glass-card px-3 py-2">
      <Calendar className="w-4 h-4 text-muted-foreground pointer-events-none flex-shrink-0" />
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={showAll}
        className="bg-transparent border-none text-sm text-foreground focus:outline-none disabled:opacity-40 date-input-clean"
      />
      <button
        onClick={() => onToggleAll(!showAll)}
        className={`text-xs px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${showAll ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground'}`}
      >
        {showAll ? t('all_dates') : t('today')}
      </button>
    </div>
  );
}