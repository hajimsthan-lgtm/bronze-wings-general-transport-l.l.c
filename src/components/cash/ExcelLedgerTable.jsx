import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Filter, Search, X, AlertTriangle, Wrench, CheckCircle2 } from 'lucide-react';

/**
 * Excel-like ledger table with:
 *  - Click-to-sort column headers
 *  - Per-column filter dropdowns (unique values, checkboxes, search)
 *  - Missing reference detection + highlight
 *  - "Fix missing refs" auto-generator
 */
export default function ExcelLedgerTable({
  rows,                 // already-filtered display rows (latest-first)
  columns,              // [{ key, label, align, width, mono, numeric, filterable, sortable }]
  onEdit,               // (row) => void
  onDelete,             // (id) => void
  refKey,               // key for reference column (for missing-ref detection)
  onFixMissingRef,      // async (row, generatedRef) => void  — called per row to persist
  showActions = true,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [colFilters, setColFilters] = useState({});   // { [colKey]: Set<string> }
  const [openFilterCol, setOpenFilterCol] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [fixing, setFixing] = useState(false);
  const [fixedRefs, setFixedRefs] = useState({});     // { [rowId]: generatedRef }
  const filterRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setOpenFilterCol(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Rows with missing reference
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

  // Apply column-level filters + sort
  const processedRows = useMemo(() => {
    let result = rows;
    // column filters
    for (const [colKey, selected] of Object.entries(colFilters)) {
      if (!selected || selected.size === 0) continue;
      result = result.filter((r) => {
        let v = r[colKey];
        if (v === undefined || v === null || v === '') v = '(blank)';
        else if (columns.find((c) => c.key === colKey)?.numeric) v = Number(v) || 0;
        return selected.has(v);
      });
    }
    // sort
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

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] py-10 text-center">
        <div className="empty-orb w-14 h-14 rounded-full flex items-center justify-center mb-3">
          {emptyIcon ? <emptyIcon className="w-6 h-6 text-primary/70" /> : <Search className="w-6 h-6 text-primary/70" />}
        </div>
        <p className="text-sm font-semibold text-foreground/90">{emptyTitle || 'No entries'}</p>
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-[280px]">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Toolbar: missing-ref alert + active filters */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">
            <span className="text-foreground font-semibold">{processedRows.length}</span> / {rows.length} rows
          </span>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors">
              <X className="w-3 h-3" /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
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

      {/* Scrollable table */}
      <div className="overflow-auto thin-scroll" style={{ maxHeight: 'calc(100vh - 480px)' }}>
        <table className="w-full text-sm trips-grid-table">
          <thead className="sticky top-0 z-20">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background/95 backdrop-blur-sm border-b border-white/10">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const filterActive = colFilters[col.key] && colFilters[col.key].size > 0;
                return (
                  <th
                    key={col.key}
                    className={`text-${col.align || 'left'} font-semibold px-4 py-2.5 whitespace-nowrap relative ${col.sortable ? 'cursor-pointer hover:text-foreground' : ''}`}
                    style={col.width ? { width: col.width } : {}}
                  >
                    <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                      {col.sortable && (
                        <button onClick={() => toggleSort(col.key)} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                          {col.label}
                          <span className="flex flex-col -space-y-1">
                            <ChevronUp className={`w-2.5 h-2.5 ${isSorted && sortDir === 'asc' ? 'text-primary' : 'text-white/20'}`} />
                            <ChevronDown className={`w-2.5 h-2.5 ${isSorted && sortDir === 'desc' ? 'text-primary' : 'text-white/20'}`} />
                          </span>
                        </button>
                      )}
                      {!col.sortable && <span>{col.label}</span>}
                      {col.filterable && (
                        <div className="relative" ref={openFilterCol === col.key ? filterRef : null}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenFilterCol(openFilterCol === col.key ? null : col.key); setFilterSearch(''); }}
                            className={`p-0.5 rounded transition-colors ${filterActive ? 'text-primary' : 'text-white/30 hover:text-white/60'}`}
                          >
                            <Filter className="w-3 h-3" />
                          </button>
                          {openFilterCol === col.key && (
                            <div
                              className="absolute top-full right-0 mt-1 w-56 glass-card z-30 p-2"
                              style={{ borderRadius: 12 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/5">
                                <Search className="w-3 h-3 text-white/40" />
                                <input
                                  type="text"
                                  value={filterSearch}
                                  onChange={(e) => setFilterSearch(e.target.value)}
                                  placeholder="Search values…"
                                  className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-white/30"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-48 overflow-auto thin-scroll space-y-0.5">
                                {(uniqueValues[col.key] || [])
                                  .filter((v) => String(v).toLowerCase().includes(filterSearch.toLowerCase()))
                                  .map((v) => {
                                    const checked = colFilters[col.key]?.has(v);
                                    return (
                                      <label key={String(v)} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer text-xs">
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
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                <button onClick={() => clearColFilter(col.key)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Clear</button>
                                <button onClick={() => setOpenFilterCol(null)} className="text-[10px] text-primary hover:text-primary-light transition-colors font-semibold">Done</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
              {showActions && <th className="px-4 py-2.5 w-20"></th>}
            </tr>
          </thead>
          <tbody>
            {processedRows.map((r) => {
              const isMissingRef = missingRefIds.has(r.id) && !fixedRefs[r.id];
              const isFixed = fixedRefs[r.id];
              return (
                <tr
                  key={r.id}
                  className={`border-t border-white/5 hover:bg-white/[0.02] transition-colors ${isMissingRef ? 'bg-amber-500/[0.04]' : ''}`}
                >
                  {columns.map((col) => {
                    let val = col.key === refKey ? getDisplayRef(r) : r[col.key];
                    const isRefCol = col.key === refKey;
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-2.5 text-${col.align || 'left'} ${col.mono ? 'font-mono' : ''} ${col.numeric ? 'tabular-nums' : ''} text-xs whitespace-nowrap`}
                      >
                        {isRefCol && isMissingRef && (
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="italic">missing</span>
                          </span>
                        )}
                        {isRefCol && isFixed && (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {val}
                          </span>
                        )}
                        {(!isRefCol || (!isMissingRef && !isFixed)) && (
                          col.numeric
                            ? (val !== undefined && val !== null && val !== '' ? (typeof val === 'number' ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val) : '—')
                            : (val || '—')
                        )}
                      </td>
                    );
                  })}
                  {showActions && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onEdit(r)} className="text-white/30 hover:text-amber-400 transition-colors" aria-label="Edit">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                        <button onClick={() => onDelete(r.id)} className="text-white/30 hover:text-rose-400 transition-colors" aria-label="Delete">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}