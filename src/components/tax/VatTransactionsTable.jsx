import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownLeft, FileText, Receipt } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import ExportButtons from '@/components/common/ExportButtons';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { VAT_RATE } from '@/lib/taxCalculations';

const POSTED_INVOICE_STATUSES = ['unsigned', 'signed', 'sent', 'partially_paid', 'paid', 'overdue'];

function buildTransactions(invoices, expenses) {
  const rows = [];

  // Output VAT from posted invoices
  (invoices || []).forEach((inv) => {
    if (!POSTED_INVOICE_STATUSES.includes(inv.status) || inv.voided) return;
    const vatRate = Number(inv.vat_rate) || 0;
    const lineItems = inv.line_items || [];
    const hasItems = lineItems.length > 0;
    const allExempt = hasItems && lineItems.every((li) => li.vat_excluded);

    let category;
    if (allExempt) category = 'Exempt';
    else if (vatRate === 0) category = 'Zero-rated';
    else category = 'Standard-rated (5%)';

    rows.push({
      date: inv.issue_date || '',
      type: 'output',
      reference: inv.invoice_number || '-',
      description: inv.client_name || '-',
      category,
      amount: Number(inv.subtotal) || 0,
      vat_rate: vatRate > 0 ? `${vatRate}%` : '0%',
      vat_amount: Number(inv.vat_amount) || 0,
    });
  });

  // Input VAT from approved expenses
  (expenses || []).forEach((e) => {
    if (e.status !== 'approved') return;
    const amt = Number(e.amount) || 0;
    rows.push({
      date: e.date || '',
      type: 'input',
      reference: e.reference_number || (e.id ? String(e.id).slice(0, 8).toUpperCase() : '-'),
      description: e.description || e.vendor_name || e.category || '-',
      category: 'Input VAT (5%)',
      amount: amt,
      vat_rate: '5%',
      vat_amount: amt * VAT_RATE,
    });
  });

  rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return rows;
}

const EXPORT_COLUMNS = [
  { key: 'date', label: 'Date', w: 22 },
  { key: 'type', label: 'Type', w: 20, transform: (r) => (r.type === 'output' ? 'Output VAT' : 'Input VAT') },
  { key: 'reference', label: 'Reference', w: 25, noWrap: true },
  { key: 'description', label: 'Description', w: 45 },
  { key: 'category', label: 'Category', w: 28 },
  { key: 'amount', label: 'Amount (AED)', w: 25, numeric: true },
  { key: 'vat_rate', label: 'VAT Rate', w: 18 },
  { key: 'vat_amount', label: 'VAT (AED)', w: 22, numeric: true },
];

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'output', label: 'Output VAT' },
  { value: 'input', label: 'Input VAT' },
];

export default function VatTransactionsTable({ invoices, expenses, periodLabel }) {
  const [filter, setFilter] = useState('all');

  const allRows = useMemo(() => buildTransactions(invoices, expenses), [invoices, expenses]);
  const filteredRows = useMemo(
    () => (filter === 'all' ? allRows : allRows.filter((r) => r.type === filter)),
    [allRows, filter]
  );

  const totals = useMemo(() => {
    const output = allRows.filter((r) => r.type === 'output');
    const input = allRows.filter((r) => r.type === 'input');
    return {
      outputVat: output.reduce((s, r) => s + r.vat_amount, 0),
      inputVat: input.reduce((s, r) => s + r.vat_amount, 0),
      outputCount: output.length,
      inputCount: input.length,
    };
  }, [allRows]);

  const exportData = filteredRows.map((r) => ({
    ...r,
    type: r.type === 'output' ? 'Output VAT' : 'Input VAT',
  }));

  return (
    <div>
      {/* Filter pills + export */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const count = f.value === 'all' ? allRows.length : allRows.filter((r) => r.type === f.value).length;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`sub-tab ${active ? 'sub-tab-active' : ''}`}
              >
                {f.label} <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
        <ExportButtons
          data={exportData}
          filename={`VAT-Transactions-${periodLabel || 'all'}`}
          columns={EXPORT_COLUMNS}
          title="VAT Transactions Detail"
          options={{ landscape: true, dateRange: periodLabel }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="max-h-[480px] overflow-auto">
          <Table className="trips-grid-table">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reference</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Amount</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Rate</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">VAT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                    No VAT transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row, i) => (
                  <TableRow key={i} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {row.date ? formatDate(row.date) : '-'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          row.type === 'output'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {row.type === 'output' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3" />
                        )}
                        {row.type === 'output' ? 'Output' : 'Input'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-foreground font-mono whitespace-nowrap">
                      {row.reference}
                    </TableCell>
                    <TableCell className="text-xs text-foreground max-w-[200px] truncate">
                      {row.description}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {row.category}
                    </TableCell>
                    <TableCell className="text-xs text-foreground text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground text-right tabular-nums whitespace-nowrap">
                      {row.vat_rate}
                    </TableCell>
                    <TableCell className={`text-xs text-right tabular-nums whitespace-nowrap font-semibold ${
                      row.type === 'output' ? 'text-blue-400' : 'text-amber-400'
                    }`}>
                      {formatCurrency(row.vat_amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Totals footer */}
        <div className="border-t border-border bg-muted/30 px-3 py-2.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-400" />
                {totals.outputCount} invoices
              </span>
              {' · '}
              <span className="text-blue-400 font-semibold">{formatCurrency(totals.outputVat)}</span>
            </span>
            <span className="text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Receipt className="w-3 h-3 text-amber-400" />
                {totals.inputCount} expenses
              </span>
              {' · '}
              <span className="text-amber-400 font-semibold">{formatCurrency(totals.inputVat)}</span>
            </span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">Net VAT payable: </span>
            <span className={`font-bold tabular-nums ${totals.outputVat - totals.inputVat >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatCurrency(totals.outputVat - totals.inputVat)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}