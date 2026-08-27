import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, Calendar, User, Hash, Building2 } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { daysUntil } from '@/lib/alertEngine';

const STATUS_CFG = {
  valid: { label: 'Valid', color: '#22c55e' },
  expiring_soon: { label: 'Expiring Soon', color: '#f59e0b' },
  expired: { label: 'Expired', color: '#ef4444' },
};

function getStatus(expiry, alertDays = 30) {
  const days = daysUntil(expiry);
  if (days === null) return 'valid';
  if (days < 0) return 'expired';
  if (days <= alertDays) return 'expiring_soon';
  return 'valid';
}

export default function DocumentQuickView({ doc, open, onOpenChange, typeVisuals }) {
  if (!doc) return null;

  const visuals = typeVisuals || { icon: FileText, color: '#6b7280' };
  const Icon = visuals.icon;
  const status = getStatus(doc.expiry_date, doc.alert_days || 30);
  const statusCfg = STATUS_CFG[status];
  const days = daysUntil(doc.expiry_date);
  const countdown = days !== null
    ? (days < 0 ? `${Math.abs(days)}d ago` : `${days}d left`)
    : null;

  const isImage = doc.file_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.file_url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-foreground flex items-center gap-2.5">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${visuals.color}1a`, border: `1px solid ${visuals.color}40` }}
            >
              <Icon className="w-4 h-4" style={{ color: visuals.color }} />
            </span>
            <span className="truncate">{doc.title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* File preview */}
        {doc.file_url ? (
          <div className="rounded-xl overflow-hidden border border-border mb-4 bg-background/50">
            {isImage ? (
              <img src={doc.file_url} alt={doc.title} className="w-full max-h-[400px] object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <FileText className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">PDF document</p>
                <Button onClick={() => window.open(doc.file_url, '_blank')} variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" /> Open in new tab
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl mb-4">
            <FileText className="w-10 h-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No file uploaded</p>
          </div>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetaItem icon={FileText} label="Type" value={doc.type?.replace(/_/g, ' ')} />
          {doc.related_entity && <MetaItem icon={User} label="Related To" value={doc.related_entity} />}
          {doc.reference_number && <MetaItem icon={Hash} label="Reference #" value={doc.reference_number} />}
          {doc.issuing_authority && <MetaItem icon={Building2} label="Issuing Authority" value={doc.issuing_authority} />}
          {doc.issue_date && <MetaItem icon={Calendar} label="Issue Date" value={formatDate(doc.issue_date)} />}
          {doc.expiry_date && <MetaItem icon={Calendar} label="Expiry Date" value={formatDate(doc.expiry_date)} />}
        </div>

        {/* Status + countdown */}
        {doc.expiry_date && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: `${statusCfg.color}11`, border: `1px solid ${statusCfg.color}33` }}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ color: statusCfg.color, background: `${statusCfg.color}1a`, border: `1px solid ${statusCfg.color}40` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.color }} />
              {statusCfg.label}
            </span>
            {countdown && (
              <span className="text-xs font-medium" style={{ color: statusCfg.color }}>{countdown}</span>
            )}
          </div>
        )}

        {/* Renewal history summary */}
        {doc.renewal_history?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-2">Renewal History ({doc.renewal_history.length})</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto thin-scroll">
              {[...doc.renewal_history].reverse().map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-muted/30 border border-border">
                  <span className="text-muted-foreground">{r.old_expiry ? formatDate(r.old_expiry) : '—'}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-foreground font-medium">{r.new_expiry ? formatDate(r.new_expiry) : '—'}</span>
                  {r.renewed_date && <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(r.renewed_date)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {doc.file_url && (
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={() => window.open(doc.file_url, '_blank')} className="flex-1 gap-2">
              <Download className="w-4 h-4" /> Download
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xs text-foreground font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  );
}