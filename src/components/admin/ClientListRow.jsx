import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Pencil, Trash2, ChevronRight, Phone, User } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/common/StatusBadge';
import { getInitials } from '@/lib/formatters';

const ACCENT = '#10b981';

export default function ClientListRow({ c, onOpen, onEdit, onDelete }) {
  const { t } = useI18n();
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <>
      <div className="row-card row-edge-glow flex items-center gap-3 cursor-pointer group" onClick={() => onOpen?.(c)} style={{ ['--row-accent']: ACCENT }}>
        <div className="relative w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ background: `linear-gradient(135deg, ${ACCENT}50, ${ACCENT}18)`, border: `1px solid ${ACCENT}55`, color: '#fff' }}>
          {c.image_url ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /> : getInitials(c.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
            <StatusBadge status={c.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate">{c.contact_person ? `${c.contact_person}` : ''}{c.trn ? ` · TRN ${c.trn}` : ''}</p>
        </div>
        <div className="hidden md:flex items-center gap-5 text-xs text-muted-foreground">
          <div className="text-right flex items-center gap-1.5 justify-end"><User className="w-3 h-3" /><p className="text-foreground font-medium truncate max-w-[120px]">{c.contact_person || '—'}</p></div>
          <div className="text-right flex items-center gap-1.5 justify-end"><Phone className="w-3 h-3" /><p className="text-foreground font-medium">{c.phone || '—'}</p></div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onEdit?.(c)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => setConfirmDel(true)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete?.(c)} className="bg-destructive">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}