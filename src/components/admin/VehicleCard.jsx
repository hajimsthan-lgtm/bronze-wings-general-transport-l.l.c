import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Tag, Fuel as FuelIcon, CalendarClock, ExternalLink } from 'lucide-react';
import CardChip from '@/components/admin/CardChip';

const TRUCK_IMG = 'https://media.base44.com/images/public/6a5e20fffaa71b55806cccc8/ee669be11_generated_image.png';
const ACCENT = '#3b82f6';
const STATUS_DOT = { active: '#34d399', maintenance: '#f59e0b', inactive: '#94a3b8' };

function yearsLeft(dateStr) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (days < 0) return 'Exp';
  const y = Math.floor(days / 365);
  if (y >= 1) return `${y}y`;
  const m = Math.floor(days / 30);
  return m <= 0 ? '<1m' : `${m}m`;
}

export default function VehicleCard({ v, onOpen, onEdit, onDelete }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(false);
  const dot = STATUS_DOT[v.status] || '#94a3b8';

  return (
    <div
      className={`entity-card cursor-pointer animate-fade-in-up relative overflow-hidden ${selected ? 'ring-2 ring-primary/50 border-primary/40' : ''}`}
      onClick={() => setSelected((s) => !s)}
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20" style={{ background: ACCENT }} />

      {/* Header: label + status */}
      <div className="relative flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">Plate</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium flex-shrink-0" style={{ background: `${dot}1a`, border: `1px solid ${dot}40`, color: dot }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
          {(v.status || '').replace(/_/g, ' ')}
        </span>
      </div>

      {/* Plate number */}
      <p className="relative mt-1 text-2xl font-bold tracking-tight text-foreground font-display truncate">{v.plate_number}</p>
      <p className="relative text-xs text-muted-foreground truncate mt-0.5">{v.make} {v.model}{v.year ? ` · ${v.year}` : ''}</p>

      {/* Truck photo band */}
      <div className="relative mt-3 h-28 rounded-xl overflow-hidden border border-white/10">
        <img src={TRUCK_IMG} alt="vehicle" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.10) 0%, rgba(10,10,10,0.55) 100%)' }} />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }} />
      </div>

      {/* Metadata chips */}
      <div className="relative mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <CardChip icon={Tag} label="Type" value={v.type} accent={ACCENT} />
        <CardChip icon={FuelIcon} label="Fuel" value={v.fuel_type} accent={ACCENT} />
        <CardChip icon={CalendarClock} label="Reg" value={yearsLeft(v.registration_expiry)} accent={ACCENT} />
      </div>

      {/* Expandable actions */}
      <div className={`relative grid transition-all duration-300 ease-out ${selected ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={onOpen} className="text-muted-foreground hover:text-foreground h-8 px-2.5 gap-1.5"><ExternalLink className="w-3.5 h-3.5" />Open</Button>
            <Button variant="ghost" size="sm" onClick={onEdit} className="text-muted-foreground hover:text-foreground h-8 px-2.5 gap-1.5"><Pencil className="w-3.5 h-3.5" />Edit</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-8 px-2.5 gap-1.5 ml-auto"><Trash2 className="w-3.5 h-3.5" />Delete</Button>
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
      </div>
    </div>
  );
}