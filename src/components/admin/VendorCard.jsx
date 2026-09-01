import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MoreVertical, Pencil, Trash2, Mail, Phone, ChevronRight, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/formatters';

const CAT_COLORS = { fuel: '#1ED760', maintenance: '#f59e0b', parts: '#a855f7', insurance: '#34d399', other: '#94a3b8' };
const STATUS_COLOR = { active: '#22C55E', inactive: '#94A3B8' };

export default function VendorCard({ v, spend = 0, onEdit, onDelete, selected = false, onSelect }) {
  const navigate = useNavigate();
  const [confirmDel, setConfirmDel] = useState(false);
  const tone = CAT_COLORS[v.category] || '#94a3b8';
  const statusColor = STATUS_COLOR[v.status] || '#94A3B8';

  return (
    <>
      <div
        className={`row-card row-edge-glow flex items-center gap-3 cursor-pointer group ${selected ? 'ring-1 ring-primary/50' : ''}`}
        onClick={() => navigate(`/admin/vendors/${v.id}`)}
        style={{ ['--row-accent']: tone }}
      >
        <div
          className="flex items-center flex-shrink-0 pr-1"
          onClick={(e) => { e.stopPropagation(); onSelect?.(!selected); }}
        >
          <button
            type="button"
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selected ? 'bg-primary border-primary' : 'border-border hover:border-primary/60'}`}
            aria-label={selected ? 'Deselect' : 'Select'}
          >
            {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
          </button>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${tone}1a`, border: `1px solid ${tone}55` }}>
          <Store className="w-5 h-5" style={{ color: tone }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{v.name}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider" style={{ color: statusColor, background: `${statusColor}15` }}>
              <span className="w-1 h-1 rounded-full" style={{ background: statusColor }} />
              {v.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate capitalize mt-0.5">
            {v.category}
            {v.contact_person ? ` · ${v.contact_person}` : ''}
            {v.phone ? ` · ${v.phone}` : ''}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(spend)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Spend</p>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onEdit?.(v)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"><Pencil className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => setConfirmDel(true)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmDel(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-foreground mb-1">Delete vendor?</p>
            <p className="text-xs text-muted-foreground mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(false)} className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/40">Cancel</button>
              <button onClick={() => { onDelete?.(v); setConfirmDel(false); }} className="flex-1 h-9 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}