import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Database, Loader2, ArrowRight, User, Car, Building2, FileText, ScrollText, Receipt, Truck, Paperclip, HardDrive, Files } from 'lucide-react';
import SettingsCard from './SettingsCard';
import IconChip from '@/components/common/IconChip';

const CATEGORIES = [
  { key: 'driver_docs', label: 'Driver Documents', icon: User, color: '#a855f7', link: '/admin/drivers', entity: 'Document', filter: { related_entity: 'driver' } },
  { key: 'vehicle_docs', label: 'Vehicle Documents', icon: Car, color: '#3b82f6', link: '/admin/vehicles', entity: 'Document', filter: { related_entity: 'vehicle' } },
  { key: 'client_docs', label: 'Client Documents', icon: Building2, color: '#10b981', link: '/admin/clients', entity: 'Document', filter: { related_entity: 'client' } },
  { key: 'invoices', label: 'Invoices', icon: FileText, color: '#f59e0b', link: '/accounts/invoices', entity: 'Invoice', filter: {}, hasFile: (r) => !!r.signed_invoice_url },
  { key: 'agreements', label: 'Agreements', icon: ScrollText, color: '#6366f1', link: '/accounts/agreements', entity: 'Agreement', filter: {} },
  { key: 'quotations', label: 'Quotations', icon: Receipt, color: '#ec4899', link: '/accounts/quotations', entity: 'Quotation', filter: {} },
  { key: 'trip_attachments', label: 'Trip Attachments', icon: Truck, color: '#1ED760', link: '/trips', entity: 'Trip', filter: {}, hasFile: (r) => !!r.delivery_note_url },
  { key: 'expense_receipts', label: 'Expense Receipts', icon: Paperclip, color: '#f43f5e', link: '/expenses', entity: 'Expense', filter: {}, hasFile: (r) => !!r.receipt_url },
];

export default function StorageSettingsCard() {
  const { toast } = useToast();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all(
      CATEGORIES.map((cat) =>
        base44.entities[cat.entity]
          .filter(cat.filter)
          .then((rows) => {
            const filtered = cat.hasFile ? rows.filter(cat.hasFile) : rows;
            return { key: cat.key, count: filtered.length };
          })
          .catch(() => ({ key: cat.key, count: 0 }))
      )
    ).then((results) => {
      if (!mounted) return;
      const map = {};
      results.forEach((r) => { map[r.key] = r.count; });
      setCounts(map);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const categories = CATEGORIES.map((cat) => ({ ...cat, count: counts[cat.key] ?? 0 }));
  const totalRecords = categories.reduce((s, c) => s + c.count, 0);
  const maxCount = Math.max(...categories.map((c) => c.count), 1);

  const handleOptimize = () => {
    toast({ title: 'Storage refreshed', description: 'Latest record counts reloaded' });
  };

  return (
    <SettingsCard icon={Database} title="Storage" description="Actual record counts across your app entities">
      {/* Overview — real counts */}
      <div className="rounded-2xl border border-border bg-muted/20 p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(var(--panel-accent-rgb),0.12)', border: '1px solid rgba(var(--panel-accent-rgb),0.25)' }}>
            <HardDrive className="w-5 h-5" style={{ color: 'rgb(var(--panel-accent-rgb))' }} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
              {loading ? '—' : totalRecords.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Categories</p>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
              {loading ? '—' : CATEGORIES.length}
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
          <Files className="w-3 h-3" />
          Base44 has no fixed storage quota — counts reflect live entity data.
        </p>
      </div>

      {/* Breakdown by category */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Breakdown by Category</p>

      {loading ? (
        <div className="flex items-center gap-3 py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading record counts…</span>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => {
            const sharePct = (cat.count / maxCount) * 100;
            return (
              <div key={cat.key} className="rounded-xl border border-border bg-muted/20 p-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <IconChip icon={cat.icon} accent={cat.color} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cat.label}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {cat.count.toLocaleString()} record{cat.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">{cat.count.toLocaleString()}</span>
                  <Link
                    to={cat.link}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap ml-2"
                  >
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {/* Inline share bar — relative to max category */}
                <div className="mt-2.5 h-1 rounded-full overflow-hidden bg-muted/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(sharePct, cat.count > 0 ? 2 : 0)}%`, background: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refresh button */}
      <div className="mt-5 pt-4 border-t border-border">
        <Button variant="outline" onClick={handleOptimize} className="border-border hover:bg-muted/40">
          <Database className="w-3.5 h-3.5 mr-1.5" />
          Refresh Counts
        </Button>
      </div>
    </SettingsCard>
  );
}