import { useState } from 'react';
import { Bug, ScanSearch, AlertTriangle, ChevronRight } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import DataAuditorModal from '@/components/data-auditor/DataAuditorModal';
import { useOpsFilter } from '@/lib/operationsFilterStore';

/**
 * Global header debugger — a small rounded popover that consolidates the
 * universal Data Auditor (all pages) with the trip-specific integrity
 * scanner (available on /trips & /contracts when the Operations page
 * publishes its debug trigger).
 */
export default function DebuggerPopover() {
  const [auditorOpen, setAuditorOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const ops = useOpsFilter();
  const tripDebug = ops.active && ops.debug?.onRun ? ops.debug.onRun : null;

  const runTripDebug = () => {
    setPopoverOpen(false);
    tripDebug?.();
  };

  const openAuditor = () => {
    setPopoverOpen(false);
    setAuditorOpen(true);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Data Auditor"
            title="Data Auditor — scan for errors"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-border/50 text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-primary/40 hover:bg-white/[0.05] flex-shrink-0 data-[state=open]:border-primary/50 data-[state=open]:text-primary data-[state=open]:bg-primary/10"
          >
            <Bug className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={6}
          className="w-64 p-2 rounded-2xl border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/40 ring-1 ring-white/5"
        >
          <div className="px-2.5 pt-1.5 pb-2 mb-1 border-b border-border/40">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data Integrity</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">Scan modules for mismatched records</p>
          </div>

          <button
            onClick={openAuditor}
            className="group w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-primary/10"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 text-primary border border-primary/25 group-hover:scale-105 transition-transform">
              <ScanSearch className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-semibold text-foreground">Data Auditor</span>
              <span className="block text-[11px] text-muted-foreground">Universal scan · all pages</span>
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>

          {tripDebug && (
            <button
              onClick={runTripDebug}
              className="group w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-amber-500/10"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/25 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold text-foreground">Check Trip Errors</span>
                <span className="block text-[11px] text-muted-foreground">Scan trips & contracts</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          )}
        </PopoverContent>
      </Popover>

      <DataAuditorModal open={auditorOpen} onOpenChange={setAuditorOpen} />
    </>
  );
}