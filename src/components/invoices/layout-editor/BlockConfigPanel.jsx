import React, { useState } from 'react';
import { Type, Table2, Move, RotateCcw, Check, Wand2, AlignJustify, Eye, EyeOff, Settings2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FONT_FAMILIES, FONT_WEIGHTS, ALIGNMENTS, DEFAULT_COLUMNS, smartAdjustColumns, distributeColumnsEvenly } from '@/lib/invoiceLayoutModel';
import { cn } from '@/lib/utils';

const ALIGN_ICONS = { left: AlignLeft, center: AlignCenter, right: AlignRight };

export default function BlockConfigPanel({ block, onUpdate, onResetStyle, onResetColumns, onApplyStyleToAll }) {
  const [tab, setTab] = useState('style');
  const isTable = block.type === 'table';
  const style = block.style || {};
  const spacing = block.spacing || {};
  const border = block.border || {};
  const background = block.background || {};

  const updateColumns = (i, changes) => {
    const newCols = block.columns.map((c, ci) => ci === i ? { ...c, ...changes } : c);
    onUpdate('columns', newCols);
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-3">
        <TabBtn active={tab === 'style'} onClick={() => setTab('style')} icon={Type} label="Style" />
        {isTable && <TabBtn active={tab === 'columns'} onClick={() => setTab('columns')} icon={Table2} label="Columns" />}
        <TabBtn active={tab === 'spacing'} onClick={() => setTab('spacing')} icon={Move} label="Spacing" />
      </div>

      {/* ── Style tab ── */}
      {tab === 'style' && (
        <div className="space-y-2.5">
          <Row label="Font">
            <Select value={style.fontFamily} onValueChange={v => onUpdate('style', { fontFamily: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FONT_FAMILIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          </Row>
          <Row label="Size">
            <Slider min={6} max={16} step={0.5} value={style.fontSize || 10} onChange={v => onUpdate('style', { fontSize: v })} suffix="pt" />
          </Row>
          <Row label="Weight">
            <Select value={style.fontWeight} onValueChange={v => onUpdate('style', { fontWeight: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FONT_WEIGHTS.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}</SelectContent>
            </Select>
          </Row>
          <Row label="Color">
            <div className="flex items-center gap-2">
              <input type="color" value={style.color || '#000000'} onChange={e => onUpdate('style', { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-border/40" />
              <span className="text-xs text-muted-foreground font-mono">{style.color}</span>
            </div>
          </Row>
          <Row label="Align">
            <div className="flex items-center gap-1">
              {ALIGNMENTS.map(a => (
                <button key={a.value} onClick={() => onUpdate('style', { align: a.value })}
                  className={cn('px-2.5 py-1 text-xs rounded-md border transition-all',
                    style.align === a.value ? 'bg-primary/20 text-primary border-primary/30' : 'text-muted-foreground hover:bg-muted/40 border-transparent')}>
                  {a.label}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Line spacing">
            <Slider min={1} max={2} step={0.1} value={style.lineHeight || 1.3} onChange={v => onUpdate('style', { lineHeight: v })} suffix="×" format={v => v.toFixed(1)} />
          </Row>
          <div className="flex items-center gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onResetStyle} className="h-7 text-xs gap-1"><RotateCcw className="w-3 h-3" /> Reset</Button>
            <Button variant="outline" size="sm" onClick={onApplyStyleToAll} className="h-7 text-xs gap-1"><Check className="w-3 h-3" /> Apply to all</Button>
          </div>
        </div>
      )}

      {/* ── Columns tab (table only) ── */}
      {tab === 'columns' && isTable && (
        <div className="space-y-2">
          {/* Quick tools */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button variant="default" size="sm" onClick={() => onUpdate('columns', smartAdjustColumns(block.columns))} className="h-7 text-xs gap-1" title="Auto-fit widths to content">
              <Wand2 className="w-3 h-3" /> Smart Adjust
            </Button>
            <Button variant="outline" size="sm" onClick={() => onUpdate('columns', distributeColumnsEvenly(block.columns))} className="h-7 text-xs gap-1" title="Distribute visible columns evenly">
              <AlignJustify className="w-3 h-3" /> Even
            </Button>
            <Button variant="outline" size="sm" onClick={onResetColumns} className="h-7 text-xs gap-1" title="Reset to default widths and styles">
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          </div>

          {/* Mini header preview — reflects widths + alignment */}
          <div className="flex rounded-md overflow-hidden border border-border/30 h-6">
            {block.columns?.filter(c => c.visible !== false).map(c => {
              const AlignIcon = ALIGN_ICONS[c.align] || AlignCenter;
              return (
                <div key={c.key} className="flex items-center justify-center gap-0.5 text-[9px] font-semibold text-muted-foreground bg-muted/40 border-r border-border/20 last:border-r-0 px-1 overflow-hidden"
                  style={{ width: `${c.width}%`, justifyContent: c.align === 'right' ? 'flex-end' : c.align === 'left' ? 'flex-start' : 'center' }}>
                  <AlignIcon className="w-2.5 h-2.5 opacity-50 flex-shrink-0" />
                  <span className="truncate">{c.label}</span>
                </div>
              );
            })}
          </div>

          {/* Per-column rows */}
          {block.columns?.map((col, i) => {
            const AlignIcon = ALIGN_ICONS[col.align] || AlignCenter;
            return (
              <div key={col.key} className={cn('flex items-center gap-1.5 rounded-lg border border-border/30 px-2 py-1.5', col.visible === false && 'opacity-50')}>
                {/* Visibility toggle */}
                <button onClick={() => updateColumns(i, { visible: !(col.visible !== false) })}
                  className="p-1 rounded hover:bg-muted/50 flex-shrink-0" title={col.visible !== false ? 'Hide column' : 'Show column'}>
                  {col.visible !== false ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>

                {/* Per-column style dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted/50 flex-shrink-0" title="Column alignment & text style">
                      <Settings2 className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-2">
                    <DropdownMenuLabel className="text-xs">{col.label} — Style</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Alignment */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-muted-foreground">Alignment</span>
                      <div className="flex items-center gap-1">
                        {ALIGNMENTS.map(a => {
                          const Icon = ALIGN_ICONS[a.value];
                          return (
                            <button key={a.value} onClick={() => updateColumns(i, { align: a.value })}
                              className={cn('p-1.5 rounded-md border transition-all',
                                col.align === a.value ? 'bg-primary/20 text-primary border-primary/30' : 'text-muted-foreground hover:bg-muted/40 border-transparent')}
                              title={a.label}>
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Weight */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-muted-foreground">Weight</span>
                      <Select value={col.fontWeight || 'normal'} onValueChange={v => updateColumns(i, { fontWeight: v })}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{FONT_WEIGHTS.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {/* Relative size */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Size</span>
                      <div className="flex items-center gap-1.5 w-28">
                        <input type="range" min={0.6} max={1.6} step={0.1} value={col.fontSize || 1}
                          onChange={e => updateColumns(i, { fontSize: Number(e.target.value) })}
                          className="flex-1 accent-primary" />
                        <span className="text-[10px] text-muted-foreground tabular-nums w-7">{(col.fontSize || 1).toFixed(1)}×</span>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Label */}
                <span className="text-xs text-foreground w-16 truncate flex-shrink-0 font-medium">{col.label}</span>

                {/* Width slider */}
                <input type="range" min={3} max={40} step={1} value={col.width}
                  onChange={e => updateColumns(i, { width: Number(e.target.value) })}
                  disabled={col.locked}
                  className={cn('flex-1 min-w-0', col.locked && 'opacity-40 cursor-not-allowed')} />
                <span className="text-[10px] text-muted-foreground w-7 tabular-nums flex-shrink-0">{col.width}%</span>
              </div>
            );
          })}

          <p className="text-[10px] text-muted-foreground/70 pt-0.5 leading-snug">
            <Settings2 className="w-2.5 h-2.5 inline mr-1" />
            Tap the gear icon per column to set alignment, weight & size. Text auto-clips to column width — no overlap.
          </p>
        </div>
      )}

      {/* ── Spacing tab ── */}
      {tab === 'spacing' && (
        <div className="space-y-2.5">
          <Row label="Space above">
            <Slider min={0} max={20} step={1} value={spacing.paddingTop || 0} onChange={v => onUpdate('spacing', { paddingTop: v })} suffix="mm" />
          </Row>
          <Row label="Space below">
            <Slider min={0} max={20} step={1} value={spacing.paddingBottom || 0} onChange={v => onUpdate('spacing', { paddingBottom: v })} suffix="mm" />
          </Row>
          <Row label="Line above">
            <Switch checked={border.top || false} onCheckedChange={v => onUpdate('border', { top: v })} className="scale-90" />
          </Row>
          <Row label="Line below">
            <Switch checked={border.bottom || false} onCheckedChange={v => onUpdate('border', { bottom: v })} className="scale-90" />
          </Row>
          <Row label="Shading">
            <div className="flex items-center gap-2">
              <Switch checked={background.enabled || false} onCheckedChange={v => onUpdate('background', { enabled: v })} className="scale-90" />
              {background.enabled && (
                <input type="color" value={background.color || '#f5f5f5'} onChange={e => onUpdate('background', { color: e.target.value })} className="w-7 h-7 rounded cursor-pointer bg-transparent border border-border/40" />
              )}
            </div>
          </Row>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick}
      className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
        active ? 'bg-primary/15 text-primary border-primary/25' : 'text-muted-foreground hover:bg-muted/40 border-transparent')}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Slider({ min, max, step, value, onChange, suffix, format }) {
  return (
    <div className="flex items-center gap-2">
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="flex-1 accent-primary" />
      <span className="text-xs text-muted-foreground w-10 tabular-nums">{format ? format(value) : value}{suffix}</span>
    </div>
  );
}