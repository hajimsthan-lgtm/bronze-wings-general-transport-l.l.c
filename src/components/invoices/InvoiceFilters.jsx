import { Search } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function InvoiceFilters({
  search, setSearch,
  status, setStatus,
  customer, setCustomer, customers,
  months, activeMonths, onToggleMonth,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-400">Active filters</span>

      <Select value={customer} onValueChange={setCustomer}>
        <SelectTrigger className="h-9 w-[150px] bg-white border-slate-200 text-slate-700 text-xs">
          <SelectValue placeholder="All customers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All customers</SelectItem>
          {customers.map(c => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="h-9 w-[140px] bg-white border-slate-200 text-slate-700 text-xs">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="partially_paid">Partial</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {months.map(m => (
        <button
          key={m.key}
          onClick={() => onToggleMonth(m.key)}
          className={`px-3 h-9 rounded-lg text-xs font-medium border transition-colors ${
            activeMonths.includes(m.key)
              ? 'bg-[#A6FF00] text-black border-[#A6FF00]'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          {m.label}
        </button>
      ))}

      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search invoices..."
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#A6FF00]/40"
        />
      </div>
    </div>
  );
}