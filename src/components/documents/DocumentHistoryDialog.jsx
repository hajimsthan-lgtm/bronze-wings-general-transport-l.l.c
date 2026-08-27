import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import { History, ArrowRight, FileText, ExternalLink, Calendar, Clock, User } from 'lucide-react';

export default function DocumentHistoryDialog({ doc, open, onOpenChange }) {
  if (!doc) return null;

  const history = doc.renewal_history || [];
  const createdDate = doc.created_date ? new Date(doc.created_date) : null;
  const updatedDate = doc.updated_date ? new Date(doc.updated_date) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Document History
          </DialogTitle>
        </DialogHeader>

        {/* Document summary */}
        <div className="glass-card p-3 mb-5 space-y-1.5">
          <p className="text-sm font-medium text-foreground">{doc.title}</p>
          <p className="text-xs text-muted-foreground capitalize">{doc.type?.replace(/_/g, ' ')} {doc.reference_number ? `· ${doc.reference_number}` : ''}</p>
          {doc.issuing_authority && <p className="text-xs text-muted-foreground">{doc.issuing_authority}</p>}
        </div>

        {/* Lifecycle metadata */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Created</p>
              <p className="text-xs text-foreground font-medium">{createdDate ? formatDate(createdDate.toISOString().split('T')[0]) : '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border">
            <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Last Updated</p>
              <p className="text-xs text-foreground font-medium">{updatedDate ? formatDate(updatedDate.toISOString().split('T')[0]) : '—'}</p>
            </div>
          </div>
          {doc.issue_date && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Issue Date</p>
                <p className="text-xs text-foreground font-medium">{formatDate(doc.issue_date)}</p>
              </div>
            </div>
          )}
          {doc.expiry_date && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Current Expiry</p>
                <p className="text-xs text-foreground font-medium">{formatDate(doc.expiry_date)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Renewal timeline */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-3">Renewal Timeline ({history.length})</p>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border rounded-xl">
              <History className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No renewals recorded yet</p>
            </div>
          ) : (
            <div className="relative space-y-3 pl-4">
              {/* Timeline line */}
              <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
              {[...history].reverse().map((r, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-3 top-3 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
                  <div className="glass-card p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-xs mb-1.5">
                      <span className="text-muted-foreground">{r.old_expiry ? formatDate(r.old_expiry) : '—'}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-foreground font-medium">{r.new_expiry ? formatDate(r.new_expiry) : '—'}</span>
                      {r.renewed_date && (
                        <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(r.renewed_date)}</span>
                      )}
                    </div>
                    {r.notes && <p className="text-[10px] text-muted-foreground mb-1">{r.notes}</p>}
                    {(r.old_file_url || r.new_file_url) && (
                      <div className="flex items-center gap-3 mt-1.5">
                        {r.old_file_url && (
                          <a href={r.old_file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Old file <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {r.new_file_url && (
                          <a href={r.new_file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                            <FileText className="w-3 h-3" /> New file <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-border">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}