import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { FileText, Loader2, Search, CheckCheck, Square } from 'lucide-react';

export default function InvoiceAllocationList({ allocations, outstandingInvoices, onToggle, onSelectAll, onDeselectAll, loading }) {
  const [search, setSearch] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!outstandingInvoices || outstandingInvoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <FileText className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">No outstanding invoices for this client</p>
      </div>
    );
  }

  // Searchable filter: match by invoice number, notes, or dates
  const filteredIndices = allocations
    .map((alloc, idx) => {
      const inv = outstandingInvoices[idx];
      const haystack = `${alloc.invoice_number || ''} ${inv?.notes || ''} ${inv?.issue_date || ''} ${inv?.due_date || ''}`.toLowerCase();
      return { idx, haystack };
    })
    .filter(({ haystack }) => !search || haystack.includes(search.toLowerCase()))
    .map(({ idx }) => idx);

  return (
    <div className="space-y-3">
      {/* Searchable Dropdown + Mass Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice #..."
            className="pl-8 h-8 text-xs bg-background border-border"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectAll(filteredIndices)}
          className="h-8 px-2.5 text-xs border-border whitespace-nowrap"
          disabled={filteredIndices.length === 0}
        >
          <CheckCheck className="w-3 h-3 mr-1" /> Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeselectAll(filteredIndices)}
          className="h-8 px-2.5 text-xs border-border whitespace-nowrap"
          disabled={filteredIndices.length === 0}
        >
          <Square className="w-3 h-3 mr-1" /> Clear
        </Button>
      </div>

      {/* Interactive Invoice Checklist */}
      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {filteredIndices.map(idx => {
          const alloc = allocations[idx];
          const inv = outstandingInvoices[idx];
          const balance = Math.max(0, (alloc.invoice_total || 0) - (alloc.already_paid || 0));
          const isFull = alloc.allocated_amount >= balance && alloc.allocated_amount > 0;
          const isPartial = alloc.allocated_amount > 0 && alloc.allocated_amount < balance;

          return (
            <div
              key={alloc.invoice_id || idx}
              className={`glass-card p-3 flex items-center gap-3 transition-opacity ${!alloc.is_selected ? 'opacity-40' : ''}`}
            >
              <Checkbox checked={alloc.is_selected} onCheckedChange={() => onToggle(idx)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{alloc.invoice_number || '—'}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {inv?.due_date && <span>Due: {formatDate(inv.due_date)}</span>}
                  {inv?.due_date && <span>·</span>}
                  <span>Outstanding: {formatCurrency(balance)}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {alloc.allocated_amount > 0 ? (
                  <>
                    <p className="text-sm font-semibold text-emerald-400 tabular-nums">
                      {formatCurrency(alloc.allocated_amount)}
                    </p>
                    <p className={`text-[10px] ${isFull ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isFull ? 'Full Pay' : 'Partial'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
          );
        })}
        {filteredIndices.length === 0 && search && (
          <p className="text-xs text-muted-foreground text-center py-4">No invoices match "{search}"</p>
        )}
      </div>
    </div>
  );
}