import { useState, useEffect } from 'react';
import { History, Loader2, Bot, User } from 'lucide-react';
import { fetchTripStatusHistory, STATUS_META } from '@/lib/tripStatusWorkflow';
import { formatDate } from '@/lib/formatters';
import moment from 'moment';

/**
 * Audit trail panel — shows status change history for a trip.
 * Used inside TripDetailSheet.
 */
export default function TripStatusHistoryPanel({ tripId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;
    let active = true;
    setLoading(true);
    fetchTripStatusHistory(tripId).then((rows) => {
      if (active) { setHistory(rows); setLoading(false); }
    });
    return () => { active = false; };
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
        <History className="w-3.5 h-3.5" />
        No status changes recorded.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((entry, idx) => {
        const prev = STATUS_META[entry.previous_status];
        const next = STATUS_META[entry.new_status];
        const isAuto = entry.source === 'automatic';
        return (
          <div key={entry.id || idx} className="flex items-start gap-3 text-xs">
            {/* Timeline dot */}
            <div className="flex flex-col items-center pt-0.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: next?.color || '#888' }}
              />
              {idx < history.length - 1 && <span className="w-px flex-1 bg-border mt-1" />}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 pb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {prev && (
                  <span className="font-medium" style={{ color: prev.color }}>{prev.label}</span>
                )}
                <span className="text-muted-foreground">→</span>
                <span className="font-medium" style={{ color: next?.color || '#888' }}>{next?.label || entry.new_status}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-0.5">
                  {isAuto ? <Bot className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                  {isAuto ? 'Automatic' : (entry.changed_by || 'User')}
                </span>
                <span>·</span>
                <span>{entry.changed_at ? moment(entry.changed_at).format('DD MMM YY, HH:mm') : ''}</span>
              </div>
              {entry.reason && (
                <p className="text-[10px] text-muted-foreground mt-1 italic">"{entry.reason}"</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}