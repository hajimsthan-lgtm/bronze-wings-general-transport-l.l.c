import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Phone, Truck, CalendarClock, ExternalLink } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { getInitials, formatDate } from '@/lib/formatters';

const ACCENT = '#a855f7';
const STATUS_DOT = { active: '#34d399', on_leave: '#f59e0b', inactive: '#94a3b8' };

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
  const [selected, setSelected] = useState(false);
  const dot = STATUS_DOT[d.status] || '#94a3b8';

  return (
    <div
      className={`entity-card cursor-pointer animate-fade-in-up ${selected ? 'ring-2 ring-primary/50 border-primary/40' : ''}`}
      onClick={() => setSelected((s) => !s)}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold relative shrink-0" style={{ background: `linear-gradient(135deg, ${ACCENT}40, ${ACCENT}10)`, border: `1px solid ${ACCENT}40`, boxShadow: `0 0 14px -4px ${ACCENT}66, inset 0 1px 0 rgba(255,255,255,0.12)` }}>
            {getInitials(d.name)}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#1a1d29]" style={{ background: dot, boxShadow: `0 0 8px ${dot}` }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Phone className="w-3 h-3" />{d.phone || '—'}</p>
          </div>
        </div>
        <StatusBadge status={d.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <MetaItem icon={Truck} label={t('vehicle')} value={d.assigned_vehicle} />
        <MetaItem icon={CalendarClock} label="License" value={d.license_expiry ? formatDate(d.license_expiry) : null} />
      </div>

      <div className={`grid transition-all duration-300 ease-out ${selected ? 'grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-border/50' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={onOpen} className="text-muted-foreground hover:text-foreground h-8 px-2 gap-1.5"><ExternalLink className="w-3.5 h-3.5" />Open</Button>
            <Button variant="ghost" size="sm" onClick={onEdit} className="text-muted-foreground hover:text-foreground h-8 px-2 gap-1.5"><Pencil className="w-3.5 h-3.5" />Edit</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-8 px-2 gap-1.5"><Trash2 className="w-3.5 h-3.5" />Delete</Button>
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
      </div>
    </div>
  );
}