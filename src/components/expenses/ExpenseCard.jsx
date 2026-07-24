import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Package } from 'lucide-react';
import ReportStatusBadge from '@/components/reports/ReportStatusBadge';
import { categoryIcons, categoryColors, hexToRgba } from './expenseMeta';

export default function ExpenseCard({ exp, onEdit, onDelete }) {
  const { t } = useI18n();
  const Icon = categoryIcons[exp.category] || Package;
  const color = categoryColors[exp.category] || '#94a3b8';

  return (
    <div className="entity-card cursor-pointer group animate-fade-in-up" onClick={() => onEdit(exp)} style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(color, 0.14), border: `1px solid ${hexToRgba(color, 0.3)}` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{exp.description || exp.category?.replace(/_/g, ' ')}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{exp.category?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <ReportStatusBadge status={exp.status} />
      </div>

      <p className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(exp.amount)}</p>

      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p className="truncate">{exp.vendor_name || '—'} · {formatDate(exp.date)}</p>
        {exp.vehicle_plate && <p className="truncate">{t('vehicle')}: <span className="text-foreground tabular-nums">{exp.vehicle_plate}</span></p>}
        {exp.driver_name && <p className="truncate">{t('driver')}: <span className="text-foreground">{exp.driver_name}</span></p>}
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={() => onEdit(exp)} className="text-muted-foreground hover:text-foreground h-8 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(exp)} className="text-muted-foreground hover:text-red-400 h-8 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}