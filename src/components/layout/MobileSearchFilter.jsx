import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useOpsFilter, setOpsSearch } from '@/lib/operationsFilterStore';
import { useInvoicesFilters, setInvoicesClientFilter, setInvoicesStatusFilter, clearInvoicesFilters } from '@/lib/invoicesStore';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1];

/**
 * Mobile-only search + filter bar rendered inside the TopBar.
 * Context-aware: wires to the operationsFilterStore on /trips & /contracts,
 * the invoices store on /accounts/invoices, and a generic global search
 * event on all other pages.
 */
export default function MobileSearchFilter() {
  const location = useLocation();
  const { t } = useI18n();
  const ops = useOpsFilter();
  const invFilters = useInvoicesFilters();

  const isOps = location.pathname === '/trips' || location.pathname === '/contracts';
  const isInvoices = location.pathname === '/accounts/invoices';
  const isGeneric = !isOps && !isInvoices;

  const [localSearch, setLocalSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Generic search → dispatch global event
  useEffect(() => {
    if (!isGeneric) return;
    const handler = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mobile:search', { detail: localSearch }));
    }, 250);
    return () => clearTimeout(handler);
  }, [localSearch, isGeneric]);

  const searchValue = isOps ? ops.search : isInvoices ? localSearch : localSearch;
  const setSearch = isOps ? setOpsSearch : setLocalSearch;

  const hasActiveFilters = isInvoices
    ? invFilters.clientFilter !== 'all' || invFilters.statusFilter !== 'all'
    : isOps
    ? ops.value !== 'all'
    : false;

  return (
    <div className="md:hidden flex items-center gap-2 px-3 pb-2 pt-1">
      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={searchValue}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${t('search')}...`}
          className="w-full h-10 rounded-xl pl-9 pr-9 text-sm bg-muted/40 border border-border/60 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 transition-colors placeholder:text-muted-foreground/70"
        />
        {searchValue && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted active:scale-90 transition-all"
            aria-label={t('clear')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter button — opens bottom sheet */}
      {(isOps || isInvoices) && (
        <button
          onClick={() => setFilterOpen(true)}
          className={cn(
            'relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-95',
            hasActiveFilters
              ? 'bg-primary/20 border-primary/50 text-primary'
              : 'bg-muted/40 border-border/60 text-muted-foreground'
          )}
          aria-label="Filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveFilters && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      )}

      {/* Filter bottom sheet — framer-motion transition */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="fixed inset-0 z-[70]"
            onClick={() => setFilterOpen(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: EASE }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(20,20,32,0.92) 0%, rgba(12,12,22,0.96) 100%)',
                backdropFilter: 'blur(28px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
                borderTop: '1px solid rgba(var(--panel-accent-rgb),0.25)',
                boxShadow: '0 -12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1.5 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center justify-between px-5 pb-3">
                <p className="text-sm font-semibold text-foreground/80">Filters</p>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 active:scale-90 transition-transform"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="px-4 space-y-3">
                {/* Status filter — trips/contracts */}
                {isOps && ops.options?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ops.options.map((s) => {
                        const count = s === 'all' ? null : ops.counts?.[s];
                        const active = ops.value === s;
                        return (
                          <button
                            key={s}
                            onClick={() => { ops.onChange?.(s); }}
                            className={cn(
                              'flex items-center justify-between h-11 px-4 rounded-xl text-sm font-medium transition-all active:scale-95',
                              active
                                ? 'bg-primary/20 border border-primary/50 text-primary'
                                : 'bg-muted/40 border border-border/60 text-foreground/80'
                            )}
                          >
                            <span>{s === 'all' ? t('all') : t(s)}</span>
                            {count != null && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Client filter — invoices */}
                {isInvoices && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Client</p>
                    <select
                      value={invFilters.clientFilter}
                      onChange={(e) => setInvoicesClientFilter(e.target.value)}
                      className="w-full h-11 rounded-xl px-4 text-sm bg-muted/40 border border-border/60 text-foreground"
                    >
                      <option value="all">All Clients</option>
                      {(invFilters.clients || []).map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status filter — invoices */}
                {isInvoices && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['all', 'draft', 'unsigned', 'signed', 'sent', 'partially_paid', 'paid', 'cancelled'].map((s) => {
                        const active = invFilters.statusFilter === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setInvoicesStatusFilter(s)}
                            className={cn(
                              'h-11 px-4 rounded-xl text-sm font-medium capitalize transition-all active:scale-95',
                              active
                                ? 'bg-primary/20 border border-primary/50 text-primary'
                                : 'bg-muted/40 border border-border/60 text-foreground/80'
                            )}
                          >
                            {s === 'all' ? 'All Status' : s.replace('_', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      if (isOps) ops.onChange?.('all');
                      if (isInvoices) clearInvoicesFilters();
                      setFilterOpen(false);
                    }}
                    className="w-full h-11 rounded-xl text-sm font-semibold bg-destructive/15 border border-destructive/40 text-destructive active:scale-95 transition-all"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}