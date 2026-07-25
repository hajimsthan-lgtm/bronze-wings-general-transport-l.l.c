import { formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Truck, Tag, User, CalendarClock, ShieldCheck } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';

const STATUS_ACCENT = { active: '#34d399', maintenance: '#f59e0b', inactive: '#94a3b8' };

function expiryTone(dateStr) {
  if (!dateStr) return 'text-foreground/90';
  const d = new Date(dateStr);
  const days = Math.ceil((d - new Date()) / 86400000);
  if (days < 0) return 'text-red-400';
  if (days <= 30) return 'text-amber-400';
  return 'text-foreground/90';
}

function MetaItem({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 leading-tight">{label}</p>
        <p className={`text-xs truncate ${tone || 'text-foreground/90'}`}>{value || '—'}</p>
      </div>
    </div>
  );
}

export default function VehicleCard({ v, onOpen, onEdit, onDelete }) {
  const { t } = useI18n();
  const accent = STATUS_ACCENT[v.status] || '#94a3b8';

  return (
    <div className="entity-card cursor-pointer group" onClick={onOpen}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl entity-avatar flex items-center justify-center relative shrink-0">
            <Truck className="w-5 h-5 text-white/75" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#1a1d29]" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{v.plate_number}</p>
            <p className="text-xs text-muted-foreground truncate">{v.make} {v.model}{v.year ? ` · ${v.year}` : ''}</p>
          </div>
        </div>
        <StatusBadge status={v.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <MetaItem icon={Tag} label="Type" value={v.type} />
        <MetaItem icon={User} label="Driver" value={v.assigned_driver} />
        <MetaItem icon={CalendarClock} label="Reg" value={v.registration_expiry ? formatDate(v.registration_expiry) : null} tone={expiryTone(v.registration_expiry)} />
        <MetaItem icon={ShieldCheck} label="Ins" value={v.insurance_expiry ? formatDate(v.insurance_expiry) : null} tone={expiryTone(v.insurance_expiry)} />
      </div>

      <div className="flex items-center gap-1 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-muted-foreground hover:text-foreground h-8 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-8 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">{t('delete')} Vehicle?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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