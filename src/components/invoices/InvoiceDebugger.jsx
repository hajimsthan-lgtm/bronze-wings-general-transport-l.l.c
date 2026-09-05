import { useState } from 'react';
import { Bug, CheckCircle2, AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatters';

/**
 * Runs diagnostics on invoices + payments and reports issues.
 * If no issues found, shows a "No errors" badge.
 */
export default function InvoiceDebugger({ invoices }) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [issues, setIssues] = useState(null);

  const runDiagnostics = async () => {
    setScanning(true);
    try {
      const found = [];

      // 1. Duplicate invoice numbers
      const numMap = {};
      (invoices || []).forEach((inv) => {
        const n = inv.invoice_number;
        if (!n) return;
        if (!numMap[n]) numMap[n] = [];
        numMap[n].push(inv);
      });
      Object.entries(numMap).forEach(([num, group]) => {
        if (group.length > 1) {
          found.push({
            severity: 'error',
            title: `Duplicate invoice number: ${num}`,
            detail: `${group.length} invoices share this number — ${group.map((g) => g.client_name).join(', ')}`,
          });
        }
      });

      // 2. Fetch payments to cross-check allocations
      const payments = await base44.entities.ClientPayment.list('-created_date', 500).catch(() => []);
      const paymentByInv = {};
      (payments || []).forEach((p) => {
        (p.allocated_invoices || []).forEach((a) => {
          if (!paymentByInv[a.invoice_id]) paymentByInv[a.invoice_id] = [];
          paymentByInv[a.invoice_id].push({ payment: p, alloc: a });
        });
      });

      // 3. Paid amount mismatch — invoice.paid_amount vs sum of allocated payments
      (invoices || []).forEach((inv) => {
        const total = Number(inv.total_amount || 0);
        const paid = Number(inv.paid_amount || 0);
        const linked = paymentByInv[inv.id] || [];
        const sumAllocs = linked.reduce((s, x) => s + Number(x.alloc.allocated_amount || 0), 0);

        if (linked.length > 0 && Math.abs(paid - sumAllocs) > 0.01) {
          found.push({
            severity: 'error',
            title: `Payment mismatch: ${inv.invoice_number}`,
            detail: `Invoice paid_amount is ${formatCurrency(paid)} but linked payments sum to ${formatCurrency(sumAllocs)} — diff ${formatCurrency(Math.abs(paid - sumAllocs))}`,
          });
        }

        // 4. Status / paid_amount inconsistency
        if (inv.status === 'paid' && paid < total - 0.01) {
          found.push({
            severity: 'warning',
            title: `Status "paid" but balance remains: ${inv.invoice_number}`,
            detail: `Total ${formatCurrency(total)}, paid ${formatCurrency(paid)}, balance ${formatCurrency(total - paid)}`,
          });
        }
        if (inv.status === 'partially_paid' && paid >= total - 0.01 && total > 0) {
          found.push({
            severity: 'warning',
            title: `Status "partially_paid" but fully paid: ${inv.invoice_number}`,
            detail: `Total ${formatCurrency(total)}, paid ${formatCurrency(paid)} — should be "paid"`,
          });
        }
        if (paid > total + 0.01 && total > 0) {
          found.push({
            severity: 'error',
            title: `Overpaid: ${inv.invoice_number}`,
            detail: `Paid ${formatCurrency(paid)} exceeds total ${formatCurrency(total)} by ${formatCurrency(paid - total)}`,
          });
        }
      });

      // 5. Orphaned payments — allocated to invoice IDs not in our list
      const invIds = new Set((invoices || []).map((i) => i.id));
      let orphanCount = 0;
      (payments || []).forEach((p) => {
        (p.allocated_invoices || []).forEach((a) => {
          if (a.invoice_id && !invIds.has(a.invoice_id)) orphanCount++;
        });
      });
      if (orphanCount > 0) {
        found.push({
          severity: 'warning',
          title: `${orphanCount} payment allocation(s) linked to missing invoices`,
          detail: 'These payments reference invoice IDs that no longer exist in the system.',
        });
      }

      setIssues(found);
    } catch (e) {
      setIssues([{ severity: 'error', title: 'Scan failed', detail: e.message }]);
    } finally {
      setScanning(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && issues === null) runDiagnostics();
  };

  const errorCount = issues?.filter((i) => i.severity === 'error').length || 0;
  const warnCount = issues?.filter((i) => i.severity === 'warning').length || 0;
  const hasIssues = errorCount > 0 || warnCount > 0;

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-colors ${
          hasIssues && issues !== null
            ? 'border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/15'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
        }`}
        title="Run invoice diagnostics"
      >
        <Bug className="w-3.5 h-3.5" />
        Debugger
        {issues !== null && hasIssues && (
          <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold bg-red-500/30 text-red-300">
            {errorCount + warnCount}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-[420px] max-w-[calc(100vw-2rem)] glass-card rounded-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Invoice Diagnostics</span>
              </div>
              <button
                onClick={runDiagnostics}
                disabled={scanning}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Scanning...' : 'Re-scan'}
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto thin-scroll p-3 space-y-2">
              {scanning && issues === null ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Scanning invoices & payments…
                </div>
              ) : !hasIssues ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-semibold text-emerald-500">No errors showing</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    All invoice allocations and payment records are consistent.
                  </p>
                </div>
              ) : (
                <>
                  {errorCount > 0 && (
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-red-400 px-1">
                      {errorCount} Error{errorCount > 1 ? 's' : ''}
                    </p>
                  )}
                  {issues.filter((i) => i.severity === 'error').map((iss, idx) => (
                    <IssueRow key={`e${idx}`} iss={iss} />
                  ))}
                  {warnCount > 0 && (
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 px-1 pt-1">
                      {warnCount} Warning{warnCount > 1 ? 's' : ''}
                    </p>
                  )}
                  {issues.filter((i) => i.severity === 'warning').map((iss, idx) => (
                    <IssueRow key={`w${idx}`} iss={iss} />
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function IssueRow({ iss }) {
  const isError = iss.severity === 'error';
  return (
    <div className={`rounded-lg border p-2.5 ${isError ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isError ? 'text-red-400' : 'text-amber-400'}`} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{iss.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{iss.detail}</p>
        </div>
      </div>
    </div>
  );
}