import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildChars, buildSentinel, segValid, isComplete } from './datetimeUtils';

/**
 * Reusable masked, segment-based input (date or time).
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
  const inputRef = externalRef || internalRef;

  const segStart = useMemo(() => {
    const map = {};
    let pos = 0;
    segs.forEach((s, i) => { map[s.key] = pos; pos += s.len + (i < segs.length - 1 ? 1 : 0); });
    return map;
  }, [segs]);

  const caretPos = useMemo(() => {
    const seg = segs.find((s) => s.key === activeSeg) || segs[0];
    return segStart[seg.key] + Math.min((raw[seg.key] || '').length, seg.len);
  }, [activeSeg, raw, segStart, segs]);

  useEffect(() => {
    if (editing && inputRef.current) {
      requestAnimationFrame(() => { try { inputRef.current.setSelectionRange(caretPos, caretPos); } catch {} });
    }
  }, [caretPos, editing, raw, inputRef]);

  const firstIncomplete = useCallback((r) => {
    for (const s of segs) if ((r[s.key] || '').length < s.len) return s.key;
    return segs[segs.length - 1].key;
  }, [segs]);

  const advance = useCallback((fromKey, r) => {
    const idx = segs.findIndex((s) => s.key === fromKey);
    for (let i = idx + 1; i < segs.length; i++) if ((r[segs[i].key] || '').length < segs[i].len) return segs[i].key;
    return fromKey;
  }, [segs]);

  const handleFocus = () => {
    if (editingRef) editingRef.current = true;
    setEditing(true); setError(false); setActiveSeg(firstIncomplete(rawRef.current));
  };
  const handleBlur = () => {
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
    if (key === 'Enter') { e.preventDefault(); if (onCommit(rawRef.current)) inputRef.current?.blur(); else setError(true); return; }
    if (key === 'Escape') { e.preventDefault(); onRevert(); setError(false); inputRef.current?.blur(); return; }
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
      if (isComplete(next, segs) && nextActive === seg.key) requestAnimationFrame(() => inputRef.current?.blur());
    }
  };

  const chars = buildChars(raw, segs, seps);
  const sentinel = buildSentinel(raw, segs, seps);
  const hasValue = segs.some((s) => (raw[s.key] || '').length > 0);

  return (
    <div className={cn('relative w-full h-full', className)}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={sentinel}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onChange={() => {}}
        onPaste={(e) => e.preventDefault()}
        aria-label={ariaLabel}
        spellCheck={false}
        autoComplete="off"
        id={id}
        name={name}
        required={required}
        className={cn(
          'w-full h-10 px-3 py-1 pl-9 text-sm font-mono tabular-nums leading-none transition-all duration-200 text-transparent caret-foreground placeholder:text-muted-foreground focus-visible:outline-none',
          hasValue && !disabled && 'pr-8',
          bare
            ? 'bg-transparent border-0 shadow-none'
            : 'rounded-xl border border-input bg-input shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)]',
          !bare && (error
            ? 'border-destructive/70'
            : 'focus-visible:border-primary/40 focus-visible:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03),0_0_0_3px_rgba(var(--panel-accent-rgb),0.15)]'),
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      <div aria-hidden className="absolute inset-0 flex items-center px-3 py-1 pl-9 text-sm font-mono tabular-nums leading-none pointer-events-none whitespace-pre select-none">
        {chars.map((c, i) => (
          <span key={i} className={c.typed === null ? '' : c.typed ? 'text-foreground' : 'text-muted-foreground/45'}>{c.ch}</span>
        ))}
      </div>
      {hasValue && !disabled && (
        <button type="button" onClick={onClear} aria-label="Clear" title="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-foreground/10 text-foreground hover:bg-foreground hover:text-background transition-colors z-10">
          <X className="w-3 h-3" />
        </button>
      )}
      {error && !bare && <p className="absolute -bottom-4 left-0 text-[10px] text-destructive">Invalid</p>}
    </div>
  );
}