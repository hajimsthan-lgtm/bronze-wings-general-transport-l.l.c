import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, X, Plus } from 'lucide-react';
import { useOpsFilter, setOpsSearch } from '@/lib/operationsFilterStore';
import { useI18n } from '@/lib/i18n';

/**
 * Mobile-only search bar rendered inside the TopBar.
 * Context-aware: wires to the operationsFilterStore on /trips & /contracts,
 * and a generic global search event on all other pages.
 */
export default function MobileSearchFilter() {
  const location = useLocation();
  const { t } = useI18n();
  const ops = useOpsFilter();

  const isTrips = location.pathname === '/trips';
  const isContracts = location.pathname === '/contracts';
  const isOps = isTrips || isContracts;

  const [localSearch, setLocalSearch] = useState('');

  const openNewForm = () => {
    window.dispatchEvent(new CustomEvent(isContracts ? 'ops:new-contract' : 'ops:new-trip'));
  };

  // Generic search → dispatch global event
  useEffect(() => {
    if (isOps) return;
    const handler = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mobile:search', { detail: localSearch }));
    }, 250);
    return () => clearTimeout(handler);
  }, [localSearch, isOps]);

  const searchValue = isOps ? ops.search : localSearch;
  const setSearch = isOps ? setOpsSearch : setLocalSearch;

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

      {/* New Trip / Contract button */}
      {isOps && (
        <button
          onClick={openNewForm}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-primary text-primary-foreground active:scale-95 transition-transform shadow-lg shadow-primary/30"
          aria-label={isContracts ? 'New Contract' : 'New Trip'}
        >
          <Plus className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}