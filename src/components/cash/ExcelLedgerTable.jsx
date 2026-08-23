import { useState, useMemo, useRef, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ChevronUp, ChevronDown, Filter, Search, X, AlertTriangle, Wrench, CheckCircle2, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE = 60;

export default function ExcelLedgerTable({
  rows,
  columns,
  onEdit,
  onDelete,
  refKey,
  onFixMissingRef,
  showActions = true,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [colFilters, setColFilters] = useState({});
  const [openFilterCol, setOpenFilterCol] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [fixing, setFixing] = useState(false);
  const [fixedRefs, setFixedRefs] = useState({});
  const [visibleCount, setVisibleCount] = useState(PAGE);

  const filterRef = useRef(null);
  const sentinelRef = useRef(null);
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setOpenFilterCol(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset visible count when rows change
  useEffect(() => { setVisibleCount(PAGE); }, [rows]);

  // Progressive rendering via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisibleCount((c) => c + PAGE);
    }, { root: tableScrollRef.current, rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [rows]);

  // Scroll sync
  const syncScroll = (source, target) => {
    if (!target) return;
    if (Math.abs(target.scrollLeft - source.scrollLeft) < 1) return;
    target.scrollLeft = source.scrollLeft;
  };

  // Missing reference detection
  const missingRefIds = useMemo(
    () => new Set(rows.filter((r) => !r[refKey] || String(r[refKey]).trim() === '' || String(r[refKey]).trim() === '—').map((r) => r.id)),
    [rows, refKey]
  );

  // Unique values per filterable column
  const uniqueValues = useMemo(() => {
    const map = {};
    for (const col of columns) {
      if (!col.filterable) continue;
      const set = new Set();
      for (const r of rows) {
        let v = r[col.key];
        if (v === undefined || v === null || v === '') v = '(blank)';
        else if (col.numeric) v = Number(v) || 0;
        set.add(v);
      }
      map[col.key] = Array.from(set).sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a).localeCompare(String(b));
      });
    }
    return map;
  }, [rows, columns]);

  // Apply column filters + sort
  const processedRows = useMemo(() => {
    let result = rows;
    for (const [colKey, selected] of Object.entries(colFilters)) {
      if (!selected || selected.size === 0) continue;
      result = result.filter((r) => {
        let v = r[colKey];
        if (v === undefined || v === null || v === '') v = '(blank)';
        else if (columns.find((c) => c.key === colKey)?.numeric) v = Number(v) || 0;
        return selected.has(v);
      });
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      result = result.slice().sort((a, b) => {
        let av = a[sortKey], bv = b[sortKey];
        if (col?.numeric) { av = Number(av) || 0; bv = Number(bv) || 0; }
        else { av = String(av || ''); bv = String(bv || ''); }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [rows, colFilters, sortKey, sortDir, columns]);

  const visibleRows = processedRows.slice(0, visibleCount);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleFilterValue = (colKey, val) => {
    setColFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[colKey] || []);
      if (set.has(val)) set.delete(val); else set.add(val);
      next[colKey] = set;
      return next;
    });
  };

  const clearColFilter = (colKey) => {
    setColFilters((prev) => {
      const next = { ...prev };
      delete next[colKey];
      return next;
    });
  };

  const clearAllFilters = () => setColFilters({});
  const activeFilterCount = Object.values(colFilters).filter((s) => s && s.size > 0).length;

  // Auto-fix missing references
  const fixMissingRefs = async () => {
    setFixing(true);
    try {
      const missing = rows.filter((r) => missingRefIds.has(r.id));
      let seq = 1;
      const updates = {};
      for (const r of missing) {
        const generated = `AUTO-${String(seq).padStart(4, '0')}`;
        updates[r.id] = generated;
        if (onFixMissingRef) {
          try { await onFixMissingRef(r, generated); } catch {}
        }
        seq++;
      }
      setFixedRefs((prev) => ({ ...prev, ...updates }));
    } finally {
      setFixing(false);
    }
  };

  const getDisplayRef = (r) => fixedRefs[r.id] || r[refKey] || '';

  // Glassmorphic header style (matches TripsTable)
  const headerBg = 'linear-gradient(180deg, rgba(var(--surf-1-rgb),0.96) 0%, rgba(var(--surf-2-rgb),0.99) 100%)';
  const headerShadow = 'inset 0 -1.5px 0 rgba(var(--panel-accent-rgb),0.30), inset 0 1px 0 rgba(255,255,255,0.06)';

  if (rows.length === 0) {
    const EmptyIcon = emptyIcon || Search;
    return (
      <div className="flex flex-col items-center justify-center min-h-[240px] py-12 text-center">
        <div className="empty-orb w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <EmptyIcon className="w-7 h-7 text-primary/70" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-foreground/90">{emptyTitle || 'No entries'}</p>
        <p className="text-xs text-muted-foreground/70 mt-1.5 max-w-[300px] leading-relaxed">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Toolbar: row count + missing-ref alert + active filters */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/40 bg-background/30">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground tabular-nums">
            <span className="text-foreground font-bold">{processedRows.length.toLocaleString()}</span>
            <span className="text-muted-foreground/50 mx-1">/</span>
            <span className="text-muted-foreground">{rows.length.toLocaleString()}</span>
            <span className="ml-1.5 text-muted-foreground/60">rows</span>
          </span>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 transition-colors text-[11px] font-semibold"
            >
              <X className="w-3 h-3" /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          {sortKey && (
            <button
              onClick={() => { setSortKey(null); setSortDir('desc'); }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 transition-colors text-[11px] font-semibold"
            >
              <ArrowUpDown className="w-3 h-3" /> Reset sort
            </button>
          )}
        </div>
        {missingRefIds.size > 0 && (
          <button
            onClick={fixMissingRefs}
            disabled={fixing}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors disabled:opacity-50"
          >
            <Wrench className="w-3.5 h-3.5" />
            {fixing ? 'Fixing…' : `Fix ${missingRefIds.size} missing ref${missingRefIds.size > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Top horizontal scrollbar — syncs with table */}
      <div className="relative mb-1.5">
        <div
          ref={topScrollRef}
          onScroll={() => syncScroll(topScrollRef.current, tableScrollRef.current)}
          className="overflow-x-auto overflow-y-hidden trips-scroll-top rounded-md"
        >
          <div style={{ width: '100%', height: '1px' }} />
        </div>
      </div>

      {/* Main scrollable table */}
      <div
        ref={tableScrollRef}
        onScroll={() => syncScroll(tableScrollRef.current, topScrollRef.current)}
        className="rounded-xl border border-border shadow-sm bg-background/40 overflow-auto max-h-[calc(100vh-440px)] trips-scroll trips-grid"
      >
        <Table className="trips-grid-table">
          <TableHeader>
            <TableRow
              className="hover:bg-transparent border-b border-border/40"
              style={{
                background: headerBg,
                backdropFilter: 'blur(16px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
                boxShadow: headerShadow,
                position: 'sticky',
                top: 0,
                zIndex: 20,
              }}
            >
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const filterActive = colFilters[col.key] && colFilters[col.key].size > 0;
                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      'relative trips-grid-th font-bold uppercase tracking-wider text-foreground/80',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    )}
                    style={col.width ? { width: col.width, minWidth: col.width, background: headerBg, backdropFilter: 'blur(16px) saturate(1.3)', WebkitBackdropFilter: 'blur(16px) saturate(1.3)', boxShadow: headerShadow, position: 'sticky', top: 0, zIndex: 20 } : { background: headerBg, backdropFilter: 'blur(16px) saturate(1.3)', WebkitBackdropFilter: 'blur(16px) saturate(1.3)', boxShadow: headerShadow, position: 'sticky', top: 0, zIndex: 20 }}
                  >
                    <div className={cn('flex items-center gap-1', col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start')}>
                      {col.sortable && (
                        <button
                          onClick={() => toggleSort(col.key)}
                          className={cn(
                            'flex items-center gap-1 transition-colors text-xs font-bold',
                            isSorted ? 'text-primary' : 'text-foreground/80 hover:text-foreground'
                          )}
                        >
                          {col.label}
                          <span className="flex flex-col -space-y-1">
                            <ChevronUp className={cn('w-3 h-3', isSorted && sortDir === 'asc' ? 'text-primary' : 'text-muted-foreground/40')} />
                            <ChevronDown className={cn('w-3 h-3', isSorted && sortDir === 'desc' ? 'text-primary' : 'text-muted-foreground/40')} />
                          </span>
                        </button>
                      )}
                      {!col.sortable && <span className="text-xs font-bold">{col.label}</span>}
                      {col.filterable && (
                        <div className="relative" ref={openFilterCol === col.key ? filterRef : null}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenFilterCol(openFilterCol === col.key ? null : col.key); setFilterSearch(''); }}
                            className={cn(
                              'p-0.5 rounded transition-colors',
                              filterActive ? 'text-primary' : 'text-muted-foreground/40 hover:text-foreground'
                            )}
                          >
                            <Filter className="w-3 h-3" />
                          </button>
                          {openFilterCol === col.key && (
                            <div
                              className="absolute top-full right-0 mt-1 w-60 glass-card z-30 p-2"
                              style={{ borderRadius: 12 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border/30">
                                <Search className="w-3 h-3 text-muted-foreground" />
                                <input
                                  type="text"
                                  value={filterSearch}
                                  onChange={(e) => setFilterSearch(e.target.value)}
                                  placeholder="Search values…"
                                  className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-52 overflow-auto thin-scroll space-y-0.5">
                                {(uniqueValues[col.key] || [])
                                  .filter((v) => String(v).toLowerCase().includes(filterSearch.toLowerCase()))
                                  .map((v) => {
                                    const checked = colFilters[col.key]?.has(v);
                                    return (
                                      <label key={String(v)} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-primary/5 cursor-pointer text-xs">
                                        <input
                                          type="checkbox"
                                          checked={!!checked}
                                          onChange={() => toggleFilterValue(col.key, v)}
                                          className="w-3.5 h-3.5 rounded accent-primary"
                                        />
                                        <span className="text-foreground/80 truncate">{col.numeric ? (typeof v === 'number' ? v.toLocaleString() : v) : String(v)}</span>
                                      </label>
                                    );
                                  })}
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                                <button onClick={() => clearColFilter(col.key)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Clear</button>
                                <button onClick={() => setOpenFilterCol(null)} className="text-[10px] text-primary hover:text-primary-light transition-colors font-semibold">Done</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                );
              })}
              {showActions && <TableHead className="w-20 text-center trips-grid-th" style={{ background: headerBg, backdropFilter: 'blur(16px) saturate(1.3)', WebkitBackdropFilter: 'blur(16px) saturate(1.3)', boxShadow: headerShadow, position: 'sticky', top: 0, zIndex: 20 }}></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((r) => {
              const isMissingRef = missingRefIds.has(r.id) && !fixedRefs[r.id];
              const isFixed = fixedRefs[r.id];
              const hasInflow = Number(r.in) > 0;
              const hasOutflow = Number(r.out) > 0;
              // Row tint: green for deposits, red for withdrawals
              const rowTint = isMissingRef
                ? 'bg-amber-500/[0.06] hover:bg-amber-500/[0.10]'
                : hasInflow
                  ? 'bg-emerald-500/[0.05] hover:bg-emerald-500/[0.09] border-l-2 border-l-emerald-500/40'
                  : hasOutflow
                    ? 'bg-rose-500/[0.05] hover:bg-rose-500/[0.09] border-l-2 border-l-rose-500/40'
                    : 'hover:bg-primary/5';
              return (
                <TableRow
                  key={r.id}
                  className={cn(
                    'transition-all duration-150 group',
                    rowTint,
                    isFixed && 'bg-emerald-500/[0.06]'
                  )}
                >
                  {columns.map((col) => {
                    let val = col.key === refKey ? getDisplayRef(r) : r[col.key];
                    const isRefCol = col.key === refKey;
                    const isInflowCol = col.key === 'in';
                    const isOutflowCol = col.key === 'out';
                    const isBalanceCol = col.key === 'running_balance';

                    return (
                      <TableCell
                        key={col.key}
                        className={cn(
                          'trips-grid-td align-middle py-3',
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                          col.mono && 'font-mono',
                          col.numeric && 'tabular-nums'
                        )}
                      >
                        {/* Reference column with missing/fixed indicators */}
                        {isRefCol && isMissingRef && (
                          <span className="inline-flex items-center gap-1.5 text-amber-400 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="italic font-medium">missing</span>
                          </span>
                        )}
                        {isRefCol && isFixed && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            {val}
                          </span>
                        )}
                        {isRefCol && !isMissingRef && !isFixed && (
                          <span className="text-foreground font-mono text-sm font-semibold">{val || '—'}</span>
                        )}

                        {/* Inflow column — green */}
                        {isInflowCol && (
                          <span className={cn('font-mono tabular-nums text-sm font-bold', hasInflow ? 'text-emerald-400' : 'text-muted-foreground/40')}>
                            {val !== undefined && val !== null && val !== '' && Number(val) > 0 ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                          </span>
                        )}

                        {/* Outflow column — red */}
                        {isOutflowCol && (
                          <span className={cn('font-mono tabular-nums text-sm font-bold', hasOutflow ? 'text-rose-400' : 'text-muted-foreground/40')}>
                            {val !== undefined && val !== null && val !== '' && Number(val) > 0 ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                          </span>
                        )}

                        {/* Running balance — blue accent */}
                        {isBalanceCol && (
                          <span className="font-mono tabular-nums text-sm font-bold text-blue-400">
                            {val !== undefined && val !== null && val !== '' ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                          </span>
                        )}

                        {/* Date column */}
                        {col.key === 'date' && (
                          <span className="text-foreground font-mono text-sm font-semibold whitespace-nowrap">{val || '—'}</span>
                        )}

                        {/* Description / recipient / other text columns */}
                        {!isRefCol && !isInflowCol && !isOutflowCol && !isBalanceCol && col.key !== 'date' && (
                          <span className="text-foreground/90 text-sm font-medium leading-snug">{val || '—'}</span>
                        )}
                      </TableCell>
                    );
                  })}
                  {showActions && (
                    <TableCell className="trips-grid-td text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEdit?.(r)}
                          className="rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 p-2 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete?.(r.id)}
                          className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 p-2 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {visibleCount < processedRows.length && (
              <TableRow ref={sentinelRef} className="hover:bg-transparent">
                <TableCell colSpan={columns.length + (showActions ? 1 : 0)} className="text-center text-xs text-muted-foreground py-3">
                  Loading more… ({visibleCount.toLocaleString()}/{processedRows.length.toLocaleString()})
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}