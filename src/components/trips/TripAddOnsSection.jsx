import { useState } from 'react';
import { Plus, Trash2, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

/**
 * Add-on Payments section for the Trip form.
 * Each add-on has: description, amount, and a VAT toggle (include/exclude VAT).
 * Add-ons are saved on the trip and appear as separate line items in invoices.
 */
export default function TripAddOnsSection({ addOns, setAddOns }) {
  const [draft, setDraft] = useState({ description: '', amount: '', vat_included: true });

  const addOnTotal = (addOns || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);

  const addAddOn = () => {
    const desc = draft.description?.trim();
    const amt = Number(draft.amount) || 0;
    if (!desc || amt <= 0) return;
    setAddOns([...(addOns || []), { description: desc, amount: amt, vat_included: draft.vat_included }]);
    setDraft({ description: '', amount: '', vat_included: true });
  };

  const removeAddOn = (idx) => {
    setAddOns((addOns || []).filter((_, i) => i !== idx));
  };

  return (
    <div className="trip-section" style={{ '--section-accent': '#fbbf24' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="trip-section-icon">
          <Receipt className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Add-on Payments</h3>
          <p className="text-[10px] text-muted-foreground">Extra charges added to this trip · appear as separate invoice items</p>
        </div>
      </div>

      {/* Existing add-ons list */}
      {(addOns || []).length > 0 && (
        <div className="space-y-1.5 mb-3">
          {(addOns || []).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.description}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatCurrency(Number(item.amount) || 0)}
                  {!item.vat_included && <span className="ml-1.5 text-amber-400 font-semibold">· No VAT</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wide">VAT</span>
                <Switch
                  checked={item.vat_included}
                  onCheckedChange={(checked) => {
                    const updated = [...(addOns || [])];
                    updated[idx] = { ...item, vat_included: checked };
                    setAddOns(updated);
                  }}
                  className="scale-75"
                />
              </div>
              <button
                onClick={() => removeAddOn(idx)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Add-ons Total</span>
            <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(addOnTotal)}</span>
          </div>
        </div>
      )}

      {/* Add new add-on row */}
      <div className="grid grid-cols-[1fr_90px_auto] gap-2 items-end">
        <div>
          <label className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">Description</label>
          <Input
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAddOn(); } }}
            placeholder="e.g. Waiting charges"
            className="h-9 text-xs"
          />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">Amount</label>
          <Input
            type="number"
            value={draft.amount}
            onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAddOn(); } }}
            placeholder="0"
            className="h-9 text-xs tabular-nums"
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <label className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">VAT</label>
          <div className="flex items-center gap-1 h-9">
            <Switch
              checked={draft.vat_included}
              onCheckedChange={(checked) => setDraft((d) => ({ ...d, vat_included: checked }))}
              className="scale-75"
            />
          </div>
        </div>
      </div>
      <button
        onClick={addAddOn}
        disabled={!draft.description?.trim() || !(Number(draft.amount) > 0)}
        className="mt-2 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Add-on
      </button>
    </div>
  );
}