import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Pencil, Trash2, ChevronRight, Phone } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/common/StatusBadge';
import { getInitials } from '@/lib/formatters';

const ACCENT = '#a855f7';

export default function DriverListRow({ d, onOpen, onEdit, onDelete }) {
  const { t } = useI18n();
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <>
      <div className="row-card row-edge-glow flex items-start gap-3 cursor-pointer group" onClick={() => onOpen?.(d)} style={{ ['--row-accent']: ACCENT }}>
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ background: `linear-gradient(135deg, ${ACCENT}50, ${ACCENT}18)`, border: `1px solid ${ACCENT}55`, color: '#fff' }}>
          {d.image_url ? <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" /> : getInitials(d.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
            <StatusBadge status={d.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate">{d.license_number ? `Lic #${d.license_number}` : ''}{d.nationality ? ` · ${d.nationality}` : ''}</p>
        </div>
        <div className="hidden md:flex items-center gap-5 text-xs text-muted-foreground">
          <div className="text-right"><p className="text-[10px] uppercase tracking-wider">Vehicle</p><p className="text-foreground font-medium truncate max-w-[120px]">{d.assigned_vehicle || '—'}</p></div>
          <div className="text-right flex items-center gap-1.5 justify-end"><Phone className="w-3 h-3" /><p className="text-foreground font-medium">{d.phone || '—'}</p></div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onEdit?.(d)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => setConfirmDel(true)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
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
    </>
  );
}