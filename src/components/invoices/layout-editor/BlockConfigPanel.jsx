import React, { useState } from 'react';
import { Type, Table2, Move, RotateCcw, Check, Wand2, AlignJustify, Eye, EyeOff, Settings2, AlignLeft, AlignCenter, AlignRight, List, Sparkles, Layers } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  FONT_FAMILIES, FONT_WEIGHTS, ALIGNMENTS, DEFAULT_COLUMNS, smartAdjustColumns, distributeColumnsEvenly,
  BILLTO_FIELDS, SIGNATURE_FIELDS, BILLTO_PRESETS, SIGNATURE_PRESETS, SIGNATURE_SMART_STYLES,
  DEFAULT_SIG_ELEMENTS, DEFAULT_TABLE_PAGINATION,
} from '@/lib/invoiceLayoutModel';
import { cn } from '@/lib/utils';

const ALIGN_ICONS = { left: AlignLeft, center: AlignCenter, right: AlignRight };

export default function BlockConfigPanel({ block, onUpdate, onResetStyle, onResetColumns, onApplyStyleToAll, onResetFields, onResetSigSpacing, onSmartRestyle, onApplyPreset, onAutoFixOverlap }) {
  const [tab, setTab] = useState('style');
  const isTable = block.type === 'table';
  const isBillTo = block.type === 'billTo';
  const isSignature = block.type === 'signature';
  const hasFields = isBillTo || isSignature;
  const style = block.style || {};
  const spacing = block.spacing || {};
  const border = block.border || {};
  const background = block.background || {};
  const fields = block.fields || {};
  const sigSpacing = block.sigSpacing || {};
  const fieldDefs = isBillTo ? BILLTO_FIELDS : isSignature ? SIGNATURE_FIELDS : [];
  const presets = isBillTo ? BILLTO_PRESETS : isSignature ? SIGNATURE_PRESETS : [];

  const updateField = (key, changes) => {
    const newFields = { ...fields, [key]: { ...fields[key], ...changes } };
    onUpdate('fields', newFields);
  };
  const updateSigSpacing = (changes) => onUpdate('sigSpacing', changes);

  const updateColumns = (i, changes) => {
    const newCols = block.columns.map((c, ci) => ci === i ? { ...c, ...changes } : c);
    onUpdate('columns', newCols);
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-3">
        <TabBtn active={tab === 'style'} onClick={() => setTab('style')} icon={Type} label="Style" />
        {hasFields && <TabBtn active={tab === 'fields'} onClick={() => setTab('fields')} icon={List} label="Fields" />}
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

      {/* ── Fields tab (billTo + signature) ── */}
      {tab === 'fields' && hasFields && (
        <div className="space-y-2.5">
          {/* Presets + Smart Restyle */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-full mb-0.5">Presets</span>
            {presets.map(p => (
              <Button key={p.name} variant="outline" size="sm" onClick={() => onApplyPreset(p)} className="h-7 text-xs gap-1" title={`Apply ${p.name} preset`}>
                <Layers className="w-3 h-3" /> {p.name}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button variant="default" size="sm" onClick={onSmartRestyle} className="h-7 text-xs gap-1" title="Auto-emphasize key fields">
              <Sparkles className="w-3 h-3" /> Smart Restyle
            </Button>
            {isBillTo && (
              <Button variant="outline" size="sm" onClick={onAutoFixOverlap} className="h-7 text-xs gap-1 border-amber-500/30 text-amber-500 hover:bg-amber-500/10" title="Auto-adjust field sizes & spacing to prevent text overlap">
                <Wand2 className="w-3 h-3" /> Auto-Fix Overlap
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onResetFields} className="h-7 text-xs gap-1"><RotateCcw className="w-3 h-3" /> Reset</Button>
          </div>

          {/* 5 Smart Signature Styles — one-click professional layouts */}
          {isSignature && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Smart Styles</span>
              <div className="grid grid-cols-1 gap-1">
                {SIGNATURE_SMART_STYLES.map(s => (
                  <button key={s.name} onClick={() => onApplyPreset(s)} title={s.desc}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/40 bg-muted/20 hover:bg-primary/10 hover:border-primary/30 transition-all text-left group">
                    <Sparkles className="w-3 h-3 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{s.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pt-1">Per-Field Style</div>

          {/* Per-field rows */}
          {fieldDefs.map(fd => {
            const f = fields[fd.key] || { visible: true, fontWeight: fd.defaultWeight, fontSize: fd.defaultSize, color: null };
            return (
              <div key={fd.key} className={cn('flex items-center gap-1.5 rounded-lg border border-border/30 px-2 py-1.5', f.visible === false && 'opacity-50')}>
                {/* Visibility toggle */}
                <button onClick={() => updateField(fd.key, { visible: !(f.visible !== false) })}
                  className="p-1 rounded hover:bg-muted/50 flex-shrink-0" title={f.visible !== false ? 'Hide field' : 'Show field'}>
                  {f.visible !== false ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>

                {/* Per-field style dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted/50 flex-shrink-0" title="Field text style">
                      <Settings2 className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-2">
                    <DropdownMenuLabel className="text-xs">{fd.label} — Style</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Weight */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-muted-foreground">Weight</span>
                      <Select value={f.fontWeight || 'normal'} onValueChange={v => updateField(fd.key, { fontWeight: v })}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{FONT_WEIGHTS.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {/* Size */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-muted-foreground">Size</span>
                      <div className="flex items-center gap-1.5 w-28">
                        <input type="range" min={0.6} max={1.6} step={0.1} value={f.fontSize || 1}
                          onChange={e => updateField(fd.key, { fontSize: Number(e.target.value) })}
                          className="flex-1 accent-primary" />
                        <span className="text-[10px] text-muted-foreground tabular-nums w-7">{(f.fontSize || 1).toFixed(1)}×</span>
                      </div>
                    </div>
                    {/* Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Color</span>
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={f.color || '#000000'} onChange={e => updateField(fd.key, { color: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border border-border/40" />
                        {f.color && (
                          <button onClick={() => updateField(fd.key, { color: null })} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>
                        )}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Label */}
                <span className="text-xs text-foreground flex-1 min-w-0 truncate font-medium">{fd.label}</span>
                {/* Current weight badge */}
                <span className="text-[9px] text-muted-foreground/70 flex-shrink-0 uppercase">{f.fontWeight === 'bold' ? 'B' : f.fontWeight === 'italic' ? 'I' : f.fontWeight === 'bolditalic' ? 'BI' : 'R'}</span>
                <span className="text-[9px] text-muted-foreground/70 flex-shrink-0 tabular-nums">{(f.fontSize || 1).toFixed(1)}×</span>
              </div>
            );
          })}

          {/* Signature element checklist */}
          {isSignature && (
            <>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pt-2">Elements Checklist</div>
              <div className="space-y-1">
                {[
                  { key: 'authorizedBy', label: 'Authorized By line' },
                  { key: 'receivedBy', label: 'Received By line' },
                  { key: 'companyStamp', label: 'Company Stamp placeholder' },
                  { key: 'dateField', label: 'Date field' },
                  { key: 'termsAccepted', label: '"Terms accepted" line' },
                ].map(el => {
                  const checked = block.sigElements?.[el.key] !== false;
                  return (
                    <label key={el.key} className="flex items-center gap-2 cursor-pointer rounded-lg border border-border/30 px-2 py-1.5 hover:bg-muted/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => onUpdate('sigElements', { [el.key]: e.target.checked })}
                        className="w-3.5 h-3.5 rounded accent-primary"
                      />
                      <span className={cn('text-xs flex-1', checked ? 'text-foreground font-medium' : 'text-muted-foreground')}>{el.label}</span>
                      {!checked && <span className="text-[9px] text-muted-foreground/60">collapsed</span>}
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground/70 leading-snug">
                Unchecked items collapse entirely — no empty gap left behind.
              </p>
              <Button variant="outline" size="sm" onClick={() => onUpdate('sigElements', { ...DEFAULT_SIG_ELEMENTS })} className="h-7 text-xs gap-1">
                <RotateCcw className="w-3 h-3" /> Reset Elements
              </Button>

              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pt-2">Signature Spacing</div>
              <Row label="Bank→Sig gap">
                <Slider min={0} max={10} step={0.5} value={sigSpacing.sigGap ?? 2} onChange={v => updateSigSpacing({ sigGap: v })} suffix="mm" format={v => v.toFixed(1)} />
              </Row>
              <Row label="Sign space">
                <Slider min={4} max={25} step={0.5} value={sigSpacing.sigTopGap ?? 12} onChange={v => updateSigSpacing({ sigTopGap: v })} suffix="mm" format={v => v.toFixed(1)} />
              </Row>
              <Row label="Line→Caption">
                <Slider min={1} max={10} step={0.5} value={sigSpacing.lineCaptionGap ?? 3.5} onChange={v => updateSigSpacing({ lineCaptionGap: v })} suffix="mm" format={v => v.toFixed(1)} />
              </Row>
              <Row label="Caption→Name">
                <Slider min={3} max={15} step={0.5} value={sigSpacing.captionNameGap ?? 7} onChange={v => updateSigSpacing({ captionNameGap: v })} suffix="mm" format={v => v.toFixed(1)} />
              </Row>
              <Button variant="outline" size="sm" onClick={onResetSigSpacing} className="h-7 text-xs gap-1"><RotateCcw className="w-3 h-3" /> Reset Spacing</Button>
            </>
          )}
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

          {/* Pagination control */}
          <div className="pt-2 border-t border-border/30 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Rows Per Page</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdate('pagination', { mode: 'auto' })}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                  (block.pagination?.mode || 'auto') === 'auto' ? 'bg-primary/20 text-primary border-primary/30' : 'text-muted-foreground hover:text-foreground border-border/40')}
              >
                Auto-balance
              </button>
              <button
                onClick={() => onUpdate('pagination', { mode: 'manual' })}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                  block.pagination?.mode === 'manual' ? 'bg-primary/20 text-primary border-primary/30' : 'text-muted-foreground hover:text-foreground border-border/40')}
              >
                Manual
              </button>
            </div>
            {block.pagination?.mode === 'manual' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={3}
                  max={100}
                  value={block.pagination?.rowsPerPage ?? 20}
                  onChange={e => onUpdate('pagination', { rowsPerPage: Math.max(3, Number(e.target.value) || 20) })}
                  className="w-20 h-8 rounded-lg bg-muted/30 border border-border/40 text-xs text-foreground px-2 text-center"
                />
                <span className="text-xs text-muted-foreground">rows per page — remaining rows flow to next page</span>
              </div>
            )}
            {(block.pagination?.mode || 'auto') === 'auto' && (
              <p className="text-[10px] text-muted-foreground/70 leading-snug">
                Auto-balance calculates max rows that fit before the footer and fills each page — no dead space.
              </p>
            )}
          </div>
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