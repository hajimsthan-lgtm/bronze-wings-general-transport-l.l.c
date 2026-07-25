import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Truck, CalendarClock, ExternalLink } from 'lucide-react';
import { getInitials, formatDate } from '@/lib/formatters';

const ACCENT = '#a855f7';
const STATUS_DOT = { active: '#34d399', on_leave: '#f59e0b', inactive: '#94a3b8' };

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-border/40 last:border-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{label}</span>
      <span className="ml-auto text-xs truncate pl-2 text-right text-foreground/90">{value || '—'}</span>
    </div>
  );
}

export default function DriverCard({ d, onOpen, onEdit, onDelete }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(false);
  const dot = STATUS_DOT[d.status] || '#94a3b8';

  return (
    <div
      className={`entity-card cursor-pointer animate-fade-in-up relative ${selected ? 'ring-2 ring-primary/50 border-primary/40' : ''}`}
      onClick={() => setSelected((s) => !s)}
    >
      <span className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full" style={{ background: ACCENT, boxShadow: `0 0 10px ${ACCENT}80` }} />
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-25" style={{ background: ACCENT }} />

      <div className="relative flex items-center gap-3 pl-2">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{ background: `linear-gradient(135deg, ${ACCENT}40, ${ACCENT}10)`, border: `1px solid ${ACCENT}50`, boxShadow: `0 0 16px -4px ${ACCENT}80, inset 0 1px 0 rgba(255,255,255,0.12)` }}>
          {getInitials(d.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
          <p className="text-xs text-muted-foreground truncate">{d.phone || '—'}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium flex-shrink-0" style={{ background: `${dot}1a`, border: `1px solid ${dot}40`, color: dot }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
          {(d.status || '').replace(/_/g, ' ')}
        </span>
      </div>

      <div className="relative mt-2 pl-2">
        <MetaRow icon={Truck} label={t('vehicle')} value={d.assigned_vehicle} />
        <MetaRow icon={CalendarClock} label="License" value={d.license_expiry ? formatDate(d.license_expiry) : null} />
      </div>

      <div className={`relative grid transition-all duration-300 ease-out ${selected ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-1 pl-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={onOpen} className="text-muted-foreground hover:text-foreground h-8 px-2.5 gap-1.5"><ExternalLink className="w-3.5 h-3.5" />Open</Button>
            <Button variant="ghost" size="sm" onClick={onEdit} className="text-muted-foreground hover:text-foreground h-8 px-2.5 gap-1.5"><Pencil className="w-3.5 h-3.5" />Edit</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-8 px-2.5 gap-1.5 ml-auto"><Trash2 className="w-3.5 h-3.5" />Delete</Button>
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