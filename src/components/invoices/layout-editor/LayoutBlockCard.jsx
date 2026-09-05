import React from 'react';
import { GripVertical, ChevronUp, ChevronDown, ChevronRight, Building2, User, Table2, Calculator, FileText, PenLine, PanelBottom, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { BLOCK_META, canMoveUp, canMoveDown } from '@/lib/invoiceLayoutModel';
import { cn } from '@/lib/utils';
import BlockConfigPanel from './BlockConfigPanel';

const ICON_MAP = { Building2, User, Table2, Calculator, FileText, PenLine, PanelBottom };

export default function LayoutBlockCard({
  block, index, layout, dragHandleProps,
  onToggle, onMove, onConfigChange, onResetConfig, onApplyStyleToAll,
  onSmartRestyle, onApplyPreset, onAutoFixOverlap,
  isExpanded, onExpand,
}) {
  const meta = BLOCK_META[block.type];
  const Icon = ICON_MAP[meta.icon] || FileText;
  const upRes = canMoveUp(layout, index);
  const downRes = canMoveDown(layout, index);

  return (
    <div className={cn(
      'rounded-xl border transition-all overflow-hidden',
      block.enabled ? 'glass-card-hover border-border/50' : 'bg-muted/20 border-border/30 opacity-50'
    )}>
      <div className="flex items-center gap-2 p-3">
        {/* Drag handle */}
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0 p-0.5 hover:bg-muted/40 rounded">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Arrow buttons */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            onClick={() => upRes.can && onMove(block.id, 'up')}
            disabled={!upRes.can}
            title={upRes.can ? 'Move up' : upRes.reason}
            className={cn('p-0.5 rounded transition-colors',
              upRes.can ? 'hover:bg-primary/15 text-muted-foreground hover:text-primary' : 'text-muted-foreground/20 cursor-not-allowed')}>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => downRes.can && onMove(block.id, 'down')}
            disabled={!downRes.can}
            title={downRes.can ? 'Move down' : downRes.reason}
            className={cn('p-0.5 rounded transition-colors',
              downRes.can ? 'hover:bg-primary/15 text-muted-foreground hover:text-primary' : 'text-muted-foreground/20 cursor-not-allowed')}>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Icon */}
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}40` }}>
          <Icon className="w-4 h-4" style={{ color: meta.color }} />
        </div>

        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{meta.label}</span>
            {!block.enabled && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-1.5 py-0.5 rounded-full bg-muted/40 flex items-center gap-1">
                <EyeOff className="w-2.5 h-2.5" /> Hidden
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{meta.desc}</div>
        </div>

        {/* Expand button */}
        <button onClick={onExpand} className="p-1 rounded hover:bg-muted/40 transition-colors flex-shrink-0" title="Configure block">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>

        {/* Enable/disable toggle */}
        <Switch checked={block.enabled} onCheckedChange={(checked) => onToggle(block.id, checked)} className="scale-90 flex-shrink-0" />
      </div>

      {/* Expanded config panel */}
      {isExpanded && (
        <div className="border-t border-border/40 p-3 bg-muted/5 animate-fade-in">
          <BlockConfigPanel
            block={block}
            onUpdate={(configType, updates) => onConfigChange(block.id, configType, updates)}
            onResetStyle={() => onResetConfig(block.id, 'style')}
            onResetColumns={() => onResetConfig(block.id, 'columns')}
            onResetFields={() => onResetConfig(block.id, 'fields')}
            onResetSigSpacing={() => onResetConfig(block.id, 'sigSpacing')}
            onApplyStyleToAll={() => onApplyStyleToAll(block.style)}
            onSmartRestyle={() => onSmartRestyle(block.id)}
            onApplyPreset={(preset) => onApplyPreset(block.id, block.type, preset)}
            onAutoFixOverlap={() => onAutoFixOverlap(block.id)}
          />
        </div>
      )}
    </div>
  );
}