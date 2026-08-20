import { Search, FileText, AlertTriangle } from 'lucide-react';
import { getInitials } from '@/lib/formatters';
import EmptyState from '@/components/common/EmptyState';

export default function DocumentListPane({
  items,
  selectedId,
  onSelect,
  tab,
  onTabChange,
  tabs,
  search,
  onSearchChange,
  statusConfig,
  numberField,
  dateField,
  dateLabel = 'Issued',
  amountField,
  computeAmount,
  subtitleField,
  onClientClick,
  emptyTitle = 'No documents found',
  emptyDescription = 'Try a different filter or search term.',
  getStatus,
  expiryField,
  expiringSoonDays = 10,
}) {
  return (
    <div className="glass-card rounded-2xl flex flex-col h-full min-h-0 overflow-hidden">
      {/* Tab header */}
      <div className="flex items-center gap-1 px-3 pt-3 border-b border-border/40">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`relative px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-t-lg ${
              tab === t.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
              tab === t.key ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {t.count}
            </span>
            {tab === t.key && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="search-2026 w-full pl-8 pr-2 py-1.5 text-xs rounded-lg"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto thin-scroll min-h-0">
        {items.length === 0 ? (
          <EmptyState icon={FileText} title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="divide-y divide-border/30">
            {items.map(item => {
              const isSelected = selectedId === item.id;
              const amount = computeAmount ? computeAmount(item) : Number(item[amountField || 'amount'] || 0);
              const status = (getStatus ? getStatus(item) : item.status) || 'draft';
              const cfg = statusConfig[status] || statusConfig.draft;

              // Expiring-soon badge (within N days of expiryField), not for already-expired/terminated
              let expiryBadge = null;
              if (expiryField && item[expiryField]) {
                const t = new Date(); t.setHours(0, 0, 0, 0);
                const e = new Date(item[expiryField]); e.setHours(0, 0, 0, 0);
                const daysLeft = Math.round((e - t) / 86400000);
                const activeish = status === 'active' || status === 'signed';
                if (activeish && daysLeft >= 0 && daysLeft <= expiringSoonDays) {
                  expiryBadge = daysLeft;
                }
              }

              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  style={{ gridTemplateColumns: '36px 1fr minmax(90px, auto)' }}
                  className={`relative grid items-center gap-3 px-3 py-3 cursor-pointer transition-all duration-200 ${
                    isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'border-l-2 border-transparent hover:bg-muted/30'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {getInitials(item.client_name)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{item[numberField] || '—'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cfg.pill}`}>
                        {cfg.label}
                      </span>
                      {expiryBadge !== null && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-amber-500/15 text-amber-400 border-amber-500/30"
                          title={expiryBadge === 0 ? 'Expires today' : `Expires in ${expiryBadge} day(s)`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {expiryBadge === 0 ? 'Expires today' : `${expiryBadge}d left`}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onClientClick?.(item.client_name); }}
                      className="text-sm font-semibold text-foreground truncate block hover:text-primary transition-colors text-left"
                    >
                      {item.client_name || '—'}
                    </button>
                    {item[subtitleField] ? (
                      <span className="text-[11px] text-muted-foreground truncate block">{item[subtitleField]}</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">{dateLabel}: {item[dateField] ? new Date(item[dateField]).toLocaleDateString() : '—'}</span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      AED {amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{item[dateField] ? new Date(item[dateField]).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}