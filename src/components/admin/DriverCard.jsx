import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Phone, Truck, CalendarClock } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { getInitials, formatDate } from '@/lib/formatters';

const STATUS_ACCENT = { active: '#34d399', on_leave: '#f59e0b', inactive: '#94a3b8' };

function MetaChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0 rounded-lg bg-white/[0.03] border border-white/[0.05] px-2 py-1.5">
      <Icon className="w-3 h-3 text-muted-foreground/70 flex-shrink-0" />
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap">{label}</span>
      <span className="text-[11px] truncate text-foreground">{value || '—'}</span>
    </div>
  );
}

export default function DriverCard({ d, onOpen, onEdit, onDelete }) {
  const { t } = useI18n();
  const accent = STATUS_ACCENT[d.status] || '#94a3b8';

  return (
    <div className="entity-card cursor-pointer group relative" onClick={onOpen}>
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-[20px]" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full entity-avatar flex items-center justify-center text-sm font-semibold relative">
            {getInitials(d.name)}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#1a1d29]" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Phone className="w-3 h-3" />{d.phone || '—'}</p>
          </div>
        </div>
        <StatusBadge status={d.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <MetaChip icon={Truck} label={t('vehicle')} value={d.assigned_vehicle} />
        <MetaChip icon={CalendarClock} label="License" value={d.license_expiry ? formatDate(d.license_expiry) : null} />
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-muted-foreground hover:text-foreground h-8 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-8 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">{t('delete')} Driver?</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive">{t('delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}