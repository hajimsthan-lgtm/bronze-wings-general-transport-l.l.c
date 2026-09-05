import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { History, ArrowRight, User, Clock, RotateCcw, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateDash } from '@/lib/formatters';

/**
 * Right-side panel showing the history of invoice number changes.
 * Each entry shows: invoice number, from → to, reason, who, when,
 * and a list of reallocated invoices.
 */
export default function InvoiceNumberHistoryPanel({ refreshKey, onUndo }) {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.InvoiceNumberChange.list('-changed_at', 100)
      .then((list) => { if (active) setChanges(list || []); })
      .catch(() => { if (active) setChanges([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0">
        <History className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Number Change History</h3>
        <span className="ml-auto text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">{changes.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll">
        {changes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full empty-orb flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">No number changes yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {changes.map((ch) => {
              const isExpanded = expanded[ch.id];
              const reallocated = ch.reallocated_invoices || [];
              return (
                <div key={ch.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[11px] font-mono text-muted-foreground line-through">{ch.from_number}</span>
                        <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-[11px] font-mono font-bold text-primary">{ch.to_number}</span>
                      </div>
                      <p className="text-[11px] text-foreground/70 mb-1.5 line-clamp-2">
                        <span className="text-foreground/90 font-medium">{ch.to_number}</span> changed from {ch.from_number}
                        {ch.reason ? ` — ${ch.reason}` : ''}
                      </p>
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
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary shrink-0"
                        onClick={() => onUndo(ch)}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  {reallocated.length > 0 && (
                    <button
                      onClick={() => toggle(ch.id)}
                      className="mt-2 flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {reallocated.length} invoice{reallocated.length !== 1 ? 's' : ''} auto-reallocated
                    </button>
                  )}

                  {isExpanded && reallocated.length > 0 && (
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}