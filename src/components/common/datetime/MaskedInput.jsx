import { useState, useRef, useCallback, Fragment } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildSentinel, segValid, isComplete } from './datetimeUtils';

/**
 * Reusable masked, segment-based input (date or time).
 *
 * No-overlap model: segment cells are rendered directly as visible children
 * of a single focusable container. The container handles all keyboard input
 * (arrow keys to navigate segments, digits to type, Backspace/Delete, Enter,
 * Escape). A hidden <input type="hidden"> holds the form id/name — it is NOT
 * stacked behind a visual overlay.
 *
 * Parent owns `raw` + `editingRef`; this component handles the keyboard/mask UI.
 */
export default function MaskedInput({
  segs, seps, raw, setRaw, onCommit, onRevert, onClear, editingRef,
  disabled, id, name, required, ariaLabel, className, bare = false, inputRef: externalRef,
}) {
  const [activeSeg, setActiveSeg] = useState(segs[0].key);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(false);
  const rawRef = useRef(raw);
  rawRef.current = raw;
  const internalRef = useRef(null);
  const containerRef = externalRef || internalRef;

  const firstIncomplete = useCallback((r) => {
    for (const s of segs) if ((r[s.key] || '').length < s.len) return s.key;
    return segs[segs.length - 1].key;
  }, [segs]);

  const advance = useCallback((fromKey, r) => {
    const idx = segs.findIndex((s) => s.key === fromKey);
    for (let i = idx + 1; i < segs.length; i++) if ((r[segs[i].key] || '').length < segs[i].len) return segs[i].key;
    return fromKey;
  }, [segs]);

  const focusContainer = useCallback(() => {
    if (!disabled && containerRef.current) containerRef.current.focus();
  }, [disabled, containerRef]);

  const handleFocus = () => {
    if (disabled) return;
    if (editingRef) editingRef.current = true;
    setEditing(true); setError(false); setActiveSeg(firstIncomplete(rawRef.current));
  };
  const handleBlur = (e) => {
    // Don't blur if focus moves to a descendant (e.g. a segment cell re-focusing)
    if (e.relatedTarget && containerRef.current?.contains(e.relatedTarget)) return;
    if (editingRef) editingRef.current = false;
    setEditing(false);
    const r = rawRef.current;
    const anyTyped = segs.some((s) => (r[s.key] || '').length > 0);
    if (anyTyped) {
      if (!isComplete(r, segs)) { setError(true); onRevert(); return; }
      if (!onCommit(r)) { setError(true); onRevert(); }
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key;
    if (key === 'ArrowLeft') { e.preventDefault(); const idx = segs.findIndex((s) => s.key === activeSeg); if (idx > 0) setActiveSeg(segs[idx - 1].key); return; }
    if (key === 'ArrowRight') { e.preventDefault(); const idx = segs.findIndex((s) => s.key === activeSeg); if (idx < segs.length - 1) setActiveSeg(segs[idx + 1].key); return; }
    if (key === 'Backspace') {
      e.preventDefault(); setError(false);
      const r = rawRef.current; const cur = r[activeSeg] || '';
      if (cur.length > 0) { setRaw({ ...r, [activeSeg]: cur.slice(0, -1) }); }
      else { const idx = segs.findIndex((s) => s.key === activeSeg); if (idx > 0) { const pk = segs[idx - 1].key; setActiveSeg(pk); setRaw({ ...r, [pk]: (r[pk] || '').slice(0, -1) }); } }
      return;
    }
    if (key === 'Delete') { e.preventDefault(); setRaw({ ...rawRef.current, [activeSeg]: '' }); return; }
    if (key === 'Enter') { e.preventDefault(); if (onCommit(rawRef.current)) containerRef.current?.blur(); else setError(true); return; }
    if (key === 'Escape') { e.preventDefault(); onRevert(); setError(false); containerRef.current?.blur(); return; }
    if (key.length !== 1) return;
    e.preventDefault();
    const seg = segs.find((s) => s.key === activeSeg);
    if (!seg) return;
    const r0 = rawRef.current;
    const cur = r0[seg.key] || '';
    let nextVal = cur; let nextActive = activeSeg; let invalidFull = false;
    if (seg.kind === 'ampm') {
      if (cur.length >= seg.len) return;
      const up = key.toUpperCase();
      if (cur.length === 0) { if (up !== 'A' && up !== 'P') return; nextVal = up; nextActive = seg.key; }
      else { if (up !== 'M') return; nextVal = cur + up; nextActive = advance(seg.key, { ...r0, [seg.key]: cur + up }); }
    } else if (seg.kind === 'num' || seg.kind === 'hour') {
      if (!/\d/.test(key)) return;
      if (cur.length >= seg.len) return;
      if (seg.key === 'minute' && cur.length === 0 && key > '5') return;
      nextVal = cur + key;
      if (nextVal.length === seg.len) {
        if (!segValid(seg, nextVal)) invalidFull = true;
        else nextActive = advance(seg.key, { ...r0, [seg.key]: nextVal });
      } else nextActive = seg.key;
    } else return;
    const next = { ...r0, [seg.key]: nextVal };
    setRaw(next);
    if (invalidFull) setError(true);
    else {
      setError(false); onCommit(next); setActiveSeg(nextActive);
    }
  };

  const sentinel = buildSentinel(raw, segs, seps);
  const hasValue = segs.some((s) => (raw[s.key] || '').length > 0);

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Hidden input for form id/name — completely invisible, no overlap */}
      <input type="hidden" id={id} name={name} value={sentinel} disabled={disabled} required={required} />

      {/* Visible interactive container — segment cells rendered directly */}
      <div
        ref={containerRef}
        role="textbox"
        tabIndex={disabled ? -1 : 0}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        onClick={focusContainer}
        className={cn(
          'w-full h-10 flex items-center text-sm font-mono tabular-nums leading-none cursor-text select-none gap-1 outline-none transition-all duration-200',
          bare ? 'pl-9 pr-3 py-1' : 'pl-3 pr-3 py-1',
          hasValue && !disabled && 'pr-8',
          bare
            ? 'bg-transparent'
            : 'rounded-full border border-[#6b3fa0]/60 bg-gradient-to-b from-[#1a1329] to-[#282040] shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),inset_0_-1px_0_rgba(255,255,255,0.05),0_0_16px_-4px_rgba(107,63,160,0.5)]',
          !bare && (error
            ? 'border-destructive/70'
            : editing && 'border-[#6b3fa0] shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),0_0_20px_-2px_rgba(107,63,160,0.7)]'),
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {segs.map((seg, i) => {
          const val = raw[seg.key] || '';
          const isActive = editing && seg.key === activeSeg;
          const cells = [];
          for (let s = 0; s < seg.len; s++) {
            if (s < val.length) cells.push({ ch: val[s], typed: true });
            else if (Array.isArray(seg.ph)) cells.push({ ch: seg.ph[s], typed: false });
            else cells.push({ ch: seg.ph, typed: false });
          }
          return (
            <Fragment key={seg.key}>
              <span
                onClick={(e) => { e.stopPropagation(); if (!disabled) { focusContainer(); setActiveSeg(seg.key); } }}
                className={cn(
                  'relative flex items-center justify-center rounded-lg h-7 px-2 transition-all duration-200 bg-[#0f0b1a] border',
                  isActive
                    ? 'border-[#00e5ff]/40 shadow-[0_0_12px_-2px_rgba(0,229,255,0.4)]'
                    : 'border-white/5 hover:border-white/10'
                )}
              >
                {isActive && <span className="absolute bottom-0 left-1 right-1 h-px bg-[#00e5ff] shadow-[0_0_6px_rgba(0,229,255,0.8)]" />}
                {cells.map((c, ci) => (
                  <span key={ci} className={cn(c.typed ? 'text-white' : 'text-[#483f60]', 'transition-colors')}>{c.ch}</span>
                ))}
              </span>
              {i < segs.length - 1 && <span className="text-muted-foreground/50 px-0.5">{seps[i]}</span>}
            </Fragment>
          );
        })}
      </div>

      {hasValue && !disabled && (
        <button type="button" onClick={onClear} aria-label="Clear" title="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-[#0f0b1a] border border-[#00d4ff]/30 text-[#00d4ff] hover:bg-[#00d4ff]/15 hover:border-[#00d4ff]/60 shadow-[0_0_10px_-2px_rgba(0,212,255,0.5)] transition-all z-10">
          <X className="w-3 h-3" />
        </button>
      )}
      {error && !bare && <p className="absolute -bottom-4 left-0 text-[10px] text-destructive">Invalid</p>}
    </div>
  );
}