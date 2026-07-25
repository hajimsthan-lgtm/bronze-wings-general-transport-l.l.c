import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Phone, Truck, CalendarClock } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { getInitials, formatDate } from '@/lib/formatters';

const STATUS_ACCENT = { active: '#34d399', on_leave: '#f59e0b', inactive: '#94a3b8' };

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 leading-tight">{label}</p>
        <p className="text-xs truncate text-foreground/90">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function DriverCard({ d, onOpen, onEdit, onDelete }) {
  const { t } = useI18n();
  const accent = STATUS_ACCENT[d.status] || '#94a3b8';

  return (
    <div className="entity-card cursor-pointer group" onClick={onOpen}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full entity-avatar flex items-center justify-center text-sm font-semibold relative shrink-0">
            {getInitials(d.name)}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#1a1d29]" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Phone className="w-3 h-3" />{d.phone || '—'}</p>
          </div>
        </div>
        <StatusBadge status={d.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <MetaItem icon={Truck} label={t('vehicle')} value={d.assigned_vehicle} />
        <MetaItem icon={CalendarClock} label="License" value={d.license_expiry ? formatDate(d.license_expiry) : null} />
      </div>

      <div className="flex items-center gap-1 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
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