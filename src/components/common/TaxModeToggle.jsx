import { cn } from '@/lib/utils';

/**
 * Toggle between "Amount excludes VAT" and "Amount includes VAT".
 *
 * @param {boolean} inclusive - current mode (false = exclusive, true = inclusive)
 * @param {(v: boolean) => void} onChange
 */
export default function TaxModeToggle({ inclusive, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'flex-1 h-8 rounded-lg text-xs font-semibold transition-all',
          !inclusive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Excl. VAT
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'flex-1 h-8 rounded-lg text-xs font-semibold transition-all',
          inclusive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Incl. VAT
      </button>
    </div>
  );
}