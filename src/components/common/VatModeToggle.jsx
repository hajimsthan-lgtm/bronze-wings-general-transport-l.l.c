import { Check } from 'lucide-react';

/**
 * Toggle between "Amount excludes VAT" and "Amount includes VAT".
 * included=false → user enters net amount, VAT added on top.
 * included=true  → user enters gross amount, VAT backed out.
 */
export default function VatModeToggle({ included, onChange }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/20">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
          !included
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-background border border-border text-muted-foreground hover:text-foreground'
        }`}
      >
        Excl. VAT
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
          included
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-background border border-border text-muted-foreground hover:text-foreground'
        }`}
      >
        Incl. VAT
      </button>
    </div>
  );
}