import React from 'react';
import { Lock, Unlock, RotateCcw, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PageOverrideBar — manual per-page row count override control.
 * Shown in the layout editor when a specific page is selected.
 * Lets the user pin an exact row count for that page (overriding auto-balance),
 * or clear the override to return to auto-balance for that page.
 */
export default function PageOverrideBar({ layout, setLayout, editPage, previewPageCount }) {
  const tableBlock = layout.blocks.find(b => b.type === 'table');
  if (!tableBlock) return null;

  const pageOverrides = tableBlock.pagination?.pageOverrides || {};
  const currentOverride = pageOverrides[editPage];
  const isManual = currentOverride && currentOverride > 0;

  const updatePagination = (updates) => {
    setLayout({
      ...layout,
      blocks: layout.blocks.map(b => b.id === tableBlock.id
        ? { ...b, pagination: { ...b.pagination, ...updates } }
        : b),
    });
  };

  const setOverride = (count) => {
    const n = Math.max(0, Math.min(100, Number(count) || 0));
    const newOverrides = { ...pageOverrides };
    if (n > 0) newOverrides[editPage] = n;
    else delete newOverrides[editPage];
    updatePagination({ pageOverrides: newOverrides });
  };

  const toggleSigOnEveryPage = () => {
    updatePagination({ sigOnEveryPage: !tableBlock.pagination?.sigOnEveryPage });
  };

  return (
    <div className="px-4 py-2.5 border-b border-border/50 bg-muted/20 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Page {editPage}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setOverride(0)}
            className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1',
              !isManual ? 'bg-primary/20 text-primary border-primary/30' : 'text-muted-foreground hover:text-foreground border-border/40')}
          >
            <Unlock className="w-3 h-3" /> Auto
          </button>
          <button
            onClick={() => setOverride(currentOverride || 15)}
            className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1',
              isManual ? 'bg-primary/20 text-primary border-primary/30' : 'text-muted-foreground hover:text-foreground border-border/40')}
          >
            <Lock className="w-3 h-3" /> Manual
          </button>
        </div>
        {isManual && (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={100}
              value={currentOverride}
              onChange={e => setOverride(e.target.value)}
              className="w-16 h-8 rounded-lg bg-muted/30 border border-border/40 text-xs text-foreground px-2 text-center"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">rows on this page</span>
            <button
              onClick={() => setOverride(0)}
              className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              title="Clear override — return to auto-balance"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {!isManual && (
          <span className="text-[10px] text-muted-foreground/70">Auto-balanced — recalculates when row data changes</span>
        )}
      </div>
      <div className="w-px h-5 bg-border/40" />
      <button
        onClick={toggleSigOnEveryPage}
        className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5',
          tableBlock.pagination?.sigOnEveryPage
            ? 'bg-primary/20 text-primary border-primary/30'
            : 'text-muted-foreground hover:text-foreground border-border/40')}
        title="Repeat the signature block on every page (not just the last)"
      >
        <PenLine className="w-3 h-3" />
        {tableBlock.pagination?.sigOnEveryPage ? 'Signature on every page' : 'Signature on last page only'}
      </button>
    </div>
  );
}