import React from 'react';
import { GripVertical, Lock, Building2, User, Table2, Calculator, FileText, PenLine, PanelBottom } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { BLOCK_META } from '@/lib/invoiceLayoutModel';
import { cn } from '@/lib/utils';

const ICON_MAP = { Building2, User, Table2, Calculator, FileText, PenLine, PanelBottom };

export default function LayoutBlockCard({ block, index, onToggle }) {
  const meta = BLOCK_META[block.type];
  const Icon = ICON_MAP[meta.icon] || FileText;
  const isFixed = !meta.canReorder;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all',
        block.enabled
          ? 'glass-card-hover border-border/50'
          : 'bg-muted/20 border-border/30 opacity-50',
        isFixed && 'cursor-default',
        !isFixed && 'cursor-grab active:cursor-grabbing'
      )}
    >
      {/* Drag handle or lock */}
      {isFixed ? (
        <Lock className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
      ) : (
        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}40` }}
      >
        <Icon className="w-4 h-4" style={{ color: meta.color }} />
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{meta.label}</div>
        <div className="text-[11px] text-muted-foreground truncate">{meta.desc}</div>
      </div>

      {/* Fixed badge */}
      {isFixed && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-2 py-0.5 rounded-full bg-muted/40">
          Fixed
        </span>
      )}

      {/* Enable/disable toggle */}
      {meta.canDisable && (
        <Switch
          checked={block.enabled}
          onCheckedChange={(checked) => onToggle(block.id, checked)}
          className="scale-90"
        />
      )}
    </div>
  );
}