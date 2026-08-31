/**
 * VAT calculation helpers — support both "excluded" and "included" modes.
 *
 * excluded (default): user enters the NET amount; VAT is added on top.
 *   subtotal = amount, vat = amount * rate/100, total = amount + vat
 *
 * included: user enters the GROSS amount; VAT is backed out.
 *   total = amount, subtotal = amount / (1 + rate/100), vat = amount - subtotal
 */
export function calcVat(amount, rate, included) {
  const amt = Number(amount) || 0;
  const r = Number(rate) || 0;
  if (included) {
    const subtotal = r > 0 ? Math.round((amt / (1 + r / 100)) * 100) / 100 : amt;
    const vat = Math.round((amt - subtotal) * 100) / 100;
    return { subtotal, vatAmount: vat, total: amt };
  }
  const vat = Math.round((amt * (r / 100)) * 100) / 100;
  const total = Math.round((amt + vat) * 100) / 100;
  return { subtotal: amt, vatAmount: vat, total };
}