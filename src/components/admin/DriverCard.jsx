import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { MoreVertical, Pencil, Trash2, ExternalLink, Truck, CalendarClock, Phone, ArrowRight } from 'lucide-react';
import { getInitials } from '@/lib/formatters';
import CardChip from '@/components/admin/CardChip';
import { useCardLock, useSpotlight, useScrollIntoViewWhenLocked } from '@/hooks/useCardLock';

const ACCENT = '#a855f7';
const STATUS_DOT = { active: '#34d399', on_leave: '#f59e0b', inactive: '#94a3b8' };
export { ACCENT as DRIVER_ACCENT };

function yearsLeft(dateStr) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (days < 0) return 'Exp';
  const y = Math.floor(days / 365);
  if (y >= 1) return `${y}y`;
  const m = Math.floor(days / 30);
  return m <= 0 ? '<1m' : `${m}m`;
}

export default function DriverCard({ d, onOpen, onEdit, onDelete }) {
  const { t } = useI18n();
  const [confirmDel, setConfirmDel] = useState(false);
  const dot = STATUS_DOT[d.status] || '#94a3b8';
  const { locked, handleClick, handleRedirect } = useCardLock(() => onOpen?.(d));
  const { onMouseMove } = useSpotlight();
  const lockRef = useScrollIntoViewWhenLocked(locked);

  return (
    <div
      ref={lockRef}
      className={`entity-card spotlight spotlight-glow cursor-pointer animate-fade-in-up relative overflow-hidden group p-3.5 ${locked ? 'card-locked' : ''}`}
      style={{ '--card-accent': ACCENT }}
      onMouseMove={onMouseMove}
      onClick={handleClick}
    >
      {/* Redirect overlay — appears when locked */}
      <div className="card-redirect-overlay" onClick={(e) => e.stopPropagation()}>
        <button className="card-redirect-btn" onClick={handleRedirect}>
          Open Details <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="entity-accent-blob absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20" style={{ background: ACCENT }} />

      <div className="relative flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">Driver</span>
        <div className="flex items-center gap-1.5">
          <span className="status-pill inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium flex-shrink-0" style={{ '--status-color': dot, background: `${dot}1a`, border: `1px solid ${dot}40`, color: dot }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
            {(d.status || '').replace(/_/g, ' ')}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button onClick={(e) => e.stopPropagation()} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen?.(d); }} className="cursor-pointer flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5" /> Open</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(d); }} className="cursor-pointer flex items-center gap-2"><Pencil className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmDel(true); }} className="cursor-pointer flex items-center gap-2 text-red-400"><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="relative mt-1 text-xl font-bold tracking-tight text-foreground font-display truncate">{d.name}</p>

      <div className="relative mt-3 h-20 rounded-xl overflow-hidden border border-border flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT}26 0%, hsl(var(--muted)) 70%)` }}>
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1.5px)', backgroundSize: '18px 18px' }} />
        <div className="relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold" style={{ background: `linear-gradient(135deg, ${ACCENT}50, ${ACCENT}18)`, border: `1px solid ${ACCENT}55`, boxShadow: `0 0 24px -6px ${ACCENT}, inset 0 1px 0 rgba(255,255,255,0.4)`, color: 'hsl(var(--foreground))' }}>
          {d.image_url ? <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" /> : getInitials(d.name)}
        </div>
      </div>

      <div className="relative mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <CardChip icon={Truck} label="Vehicle" value={d.assigned_vehicle} accent={ACCENT} />
        <CardChip icon={CalendarClock} label="License" value={yearsLeft(d.license_expiry)} accent={ACCENT} />
        <CardChip icon={Phone} label="Phone" value={d.phone} accent={ACCENT} />
      </div>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{t('delete')} Driver?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete?.(d)} className="bg-destructive">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}