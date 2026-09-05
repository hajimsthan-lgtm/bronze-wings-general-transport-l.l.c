import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { History, ArrowRight, User, Clock, RotateCcw, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { formatDateDash } from '@/lib/formatters';

/**
 * Dialog showing the full history of invoice number changes.
 * Opened via the "History" button in the Invoices page header.
 */
export default function InvoiceHistoryDialog({ open, onOpenChange, refreshKey, onUndo }) {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    base44.entities.InvoiceNumberChange.list('-changed_at', 100)
      .then((list) => { if (active) setChanges(list || []); })
      .catch(() => { if (active) setChanges([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey, open]);

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4 text-primary" />
            Invoice Number History
            <span className="ml-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{changes.length}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto thin-scroll -mx-1 px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : changes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full empty-orb flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">No number changes yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Manual invoice number edits will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {changes.map((ch) => {
                const isExpanded = expanded[ch.id];
                const reallocated = ch.reallocated_invoices || [];
                return (
                  <div key={ch.id} className="rounded-xl border border-border/50 bg-card/40 p-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-xs font-mono text-muted-foreground line-through">{ch.from_number}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-xs font-mono font-bold text-primary">{ch.to_number}</span>
                          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide ml-auto">
                            {ch.action_type?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {ch.reason && (
                          <p className="text-[11px] text-foreground/60 mb-1.5 line-clamp-2">{ch.reason}</p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            {ch.changed_by || '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {ch.changed_at ? formatDateDash(ch.changed_at.split('T')[0]) : '—'}
                          </span>
                        </div>
                      </div>
                      {onUndo && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary shrink-0"
                          onClick={() => onUndo(ch)}
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    {reallocated.length > 0 && (
                      <>
                        <button
                          onClick={() => toggle(ch.id)}
                          className="mt-2 flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {reallocated.length} invoice{reallocated.length !== 1 ? 's' : ''} auto-reallocated
                        </button>
                        {isExpanded && (
                          <div className="mt-2 space-y-1 pl-3 border-l border-primary/20">
                            {reallocated.map((r) => (
                              <div key={r.invoice_id} className="flex items-center gap-1.5 text-[10px]">
                                <span className="font-mono text-muted-foreground line-through">{r.from_number}</span>
                                <ArrowRight className="w-2.5 h-2.5 text-primary/50" />
                                <span className="font-mono font-medium text-foreground/70">{r.to_number}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}