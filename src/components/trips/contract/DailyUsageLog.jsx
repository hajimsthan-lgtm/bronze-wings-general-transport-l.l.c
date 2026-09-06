import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { useI18n } from '@/lib/i18n';

/**
 * Lightweight per-day usage log — add/remove rows of { date, hours_used }.
 */
export default function DailyUsageLog({ dailyUsage = [], onChange, inputCls }) {
  const { t } = useI18n();

  const addRow = () => {
    onChange([...dailyUsage, { date: '', hours_used: '' }]);
  };
  const removeRow = (idx) => {
    onChange(dailyUsage.filter((_, i) => i !== idx));
  };
  const updateRow = (idx, field, value) => {
    onChange(dailyUsage.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };

  return (
    <div className="space-y-2">
      {dailyUsage.length === 0 && (
        <p className="text-[11px] text-muted-foreground italic">
          No days logged yet. Click "{t('add_day') || 'Add Day'}" to start.
        </p>
      )}
      {dailyUsage.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <DatePicker
            value={row.date || ''}
            onChange={(v) => updateRow(idx, 'date', v)}
            className={`${inputCls} date-input-clean flex-1`}
          />
          <Input
            type="number"
            value={row.hours_used || ''}
            onChange={(e) => updateRow(idx, 'hours_used', e.target.value)}
            className={`${inputCls} w-20`}
            placeholder="hrs"
          />
          <button
            type="button"
            onClick={() => removeRow(idx)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
            title={t('remove_day') || 'Remove'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" /> {t('add_day') || 'Add Day'}
      </button>
    </div>
  );
}