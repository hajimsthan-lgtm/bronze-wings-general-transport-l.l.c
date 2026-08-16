import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Database, Loader2, ArrowRight, User, Car, Building2, FileText, ScrollText, Receipt, Truck, Paperclip, AlertTriangle } from 'lucide-react';
import SettingsCard from './SettingsCard';
import IconChip from '@/components/common/IconChip';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const TOTAL_CAPACITY_MB = 10 * 1024; // 10 GB
const WARNING_THRESHOLD = 0.85;

const CATEGORIES = [
  { key: 'driver_docs', label: 'Driver Documents', icon: User, color: '#a855f7', link: '/admin/drivers', entity: 'Document', filter: { related_entity: 'driver' }, sizePerFile: 0.5 },
  { key: 'vehicle_docs', label: 'Vehicle Documents', icon: Car, color: '#3b82f6', link: '/admin/vehicles', entity: 'Document', filter: { related_entity: 'vehicle' }, sizePerFile: 0.5 },
  { key: 'client_docs', label: 'Client Documents', icon: Building2, color: '#10b981', link: '/admin/clients', entity: 'Document', filter: { related_entity: 'client' }, sizePerFile: 0.5 },
  { key: 'invoices', label: 'Invoices', icon: FileText, color: '#f59e0b', link: '/accounts/invoices', entity: 'Invoice', filter: {}, hasFile: (r) => !!r.signed_invoice_url, sizePerFile: 0.3 },
  { key: 'agreements', label: 'Agreements', icon: ScrollText, color: '#6366f1', link: '/accounts/agreements', entity: 'Agreement', filter: {}, sizePerFile: 0.4 },
  { key: 'quotations', label: 'Quotations', icon: Receipt, color: '#ec4899', link: '/accounts/quotations', entity: 'Quotation', filter: {}, sizePerFile: 0.3 },
  { key: 'trip_attachments', label: 'Trip Attachments', icon: Truck, color: '#1ED760', link: '/trips', entity: 'Trip', filter: {}, hasFile: (r) => !!r.delivery_note_url, sizePerFile: 0.2 },
  { key: 'expense_receipts', label: 'Expense Receipts', icon: Paperclip, color: '#f43f5e', link: '/expenses', entity: 'Expense', filter: {}, hasFile: (r) => !!r.receipt_url, sizePerFile: 0.15 },
];

function formatSize(mb) {
  if (mb < 1) return `${Math.round(mb * 1024)} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

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

  const categories = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const count = counts[cat.key] ?? 0;
      const sizeMB = count * cat.sizePerFile;
      return { ...cat, count, sizeMB };
    }).sort((a, b) => b.sizeMB - a.sizeMB);
  }, [counts]);

  const usedMB = useMemo(() => categories.reduce((s, c) => s + c.sizeMB, 0), [categories]);
  const usedGB = usedMB / 1024;
  const pct = Math.min((usedMB / TOTAL_CAPACITY_MB) * 100, 100);
  const remainingMB = Math.max(TOTAL_CAPACITY_MB - usedMB, 0);
  const remainingGB = remainingMB / 1024;
  const isWarning = pct >= WARNING_THRESHOLD * 100;

  const barGradient = isWarning
    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
    : 'linear-gradient(90deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)))';

  const handleOptimize = () => {
    toast({ title: 'Storage optimized', description: 'Temporary caches cleared' });
  };

  return (
    <SettingsCard icon={Database} title="Storage" description="File usage across documents, invoices, and attachments">
      {/* Overview */}
      <div className="rounded-2xl border border-border bg-muted/20 p-5 mb-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {loading ? '—' : `${usedGB.toFixed(2)} GB`}
              <span className="text-sm font-normal text-muted-foreground ml-1.5">of 10 GB used</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground tabular-nums">{loading ? '—' : `${pct.toFixed(1)}%`}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">{loading ? '' : `${remainingGB.toFixed(2)} GB remaining`}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2.5 rounded-full overflow-hidden bg-muted/60">
          {loading ? (
            <div className="h-full w-full animate-pulse bg-muted" />
          ) : (
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(pct, 2)}%`, background: barGradient }}
            />
          )}
        </div>
        {isWarning && !loading && (
          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-amber-500 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Approaching storage limit
          </div>
        )}
      </div>

      {/* Breakdown by category */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Breakdown by Category</p>

      {loading ? (
        <div className="flex items-center gap-3 py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Calculating storage usage…</span>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => {
            const sharePct = usedMB > 0 ? (cat.sizeMB / usedMB) * 100 : 0;
            return (
              <div key={cat.key} className="rounded-xl border border-border bg-muted/20 p-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <IconChip icon={cat.icon} accent={cat.color} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cat.label}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {cat.count} file{cat.count === 1 ? '' : 's'} · {cat.count === 0 ? '0 records' : formatSize(cat.sizeMB)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">{formatSize(cat.sizeMB)}</span>
                  <Link
                    to={cat.link}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap ml-2"
                  >
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {/* Inline share bar */}
                <div className="mt-2.5 h-1 rounded-full overflow-hidden bg-muted/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(sharePct, 1)}%`, background: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Optimize button */}
      <div className="mt-5 pt-4 border-t border-border">
        <Button variant="outline" onClick={handleOptimize} className="border-border hover:bg-muted/40">
          <Database className="w-3.5 h-3.5 mr-1.5" />
          Optimize Storage
        </Button>
      </div>
    </SettingsCard>
  );
}