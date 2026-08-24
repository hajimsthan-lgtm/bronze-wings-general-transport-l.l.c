import { base44 } from '@/api/base44Client';
import { safeAll } from '@/lib/safeRequest';

// UAE tax constants (current law)
export const VAT_RATE = 0.05;
export const CT_RATE = 0.09;
export const CT_THRESHOLD = 375000;
export const SBR_REVENUE_LIMIT = 3000000;

// Posted invoice statuses (exclude draft and cancelled)
const POSTED_INVOICE_STATUSES = ['unsigned', 'signed', 'sent', 'partially_paid', 'paid', 'overdue'];

function inDateRange(date, start, end) {
  if (!date) return false;
  const d = String(date).slice(0, 10);
  return d >= start && d <= end;
}

/**
 * Load all invoices and expenses for tax calculations.
 */
export async function loadTaxData() {
  const [invoices, expenses] = await safeAll([
    () => base44.entities.Invoice.list('-created_date', 500),
    () => base44.entities.Expense.list('-created_date', 500),
  ], 1);
  return {
    invoices: invoices || [],
    expenses: expenses || [],
  };
}

/**
 * Load filed tax records.
 */
export async function loadFiledRecords() {
  try {
    const records = await base44.entities.TaxFiling.list('-created_date', 100);
    return records || [];
  } catch {
    return [];
  }
}

/**
 * Compute VAT metrics for a given period.
 */
export function computeVatForPeriod(invoices, expenses, periodStart, periodEnd) {
  const postedInvoices = invoices.filter(
    (inv) =>
      POSTED_INVOICE_STATUSES.includes(inv.status) &&
      inv.voided !== true &&
      inDateRange(inv.issue_date, periodStart, periodEnd)
  );

  const postedExpenses = expenses.filter(
    (e) => e.status === 'approved' && inDateRange(e.date, periodStart, periodEnd)
  );

  // Sales breakdown by rate category
  let standardRatedSales = 0;
  let zeroRatedSales = 0;
  let exemptSales = 0;
  let outputVat = 0;

  postedInvoices.forEach((inv) => {
    const vatRate = Number(inv.vat_rate) || 0;
    const subtotal = Number(inv.subtotal) || 0;
    const vatAmount = Number(inv.vat_amount) || 0;
    const lineItems = inv.line_items || [];

    // If all line items are vat_excluded → exempt
    const hasItems = lineItems.length > 0;
    const allExempt = hasItems && lineItems.every((li) => li.vat_excluded);

    if (allExempt) {
      exemptSales += subtotal;
    } else if (vatRate === 0) {
      zeroRatedSales += subtotal;
    } else {
      standardRatedSales += subtotal;
      outputVat += vatAmount;
    }
  });

  // Input VAT: 5% of approved expenses (standard-rated)
  const inputVat = postedExpenses.reduce(
    (s, e) => s + (Number(e.amount) || 0) * VAT_RATE,
    0
  );

  const netVatPayable = outputVat - inputVat;
  const totalSales = standardRatedSales + zeroRatedSales + exemptSales;

  return {
    standardRatedSales,
    zeroRatedSales,
    exemptSales,
    totalSales,
    outputVat,
    inputVat,
    netVatPayable,
    invoiceCount: postedInvoices.length,
    expenseCount: postedExpenses.length,
  };
}

/**
 * Compute 6-month VAT trend.
 */
export function computeVatTrend(invoices, expenses) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    const vat = computeVatForPeriod(invoices, expenses, start, end);
    months.push({
      label: d.toLocaleString('en', { month: 'short' }),
      outputVat: Math.round(vat.outputVat * 100) / 100,
      inputVat: Math.round(vat.inputVat * 100) / 100,
    });
  }
  return months;
}

/**
 * Compute corporate tax metrics for a fiscal year.
 */
export function computeCorporateTax(invoices, expenses, fyStart, fyEnd) {
  const postedInvoices = invoices.filter(
    (inv) =>
      POSTED_INVOICE_STATUSES.includes(inv.status) &&
      inv.voided !== true &&
      inDateRange(inv.issue_date, fyStart, fyEnd)
  );

  const postedExpenses = expenses.filter(
    (e) => e.status === 'approved' && inDateRange(e.date, fyStart, fyEnd)
  );

  // Revenue = subtotal (excluding VAT) from posted invoices
  const totalRevenue = postedInvoices.reduce(
    (s, inv) => s + (Number(inv.subtotal) || 0),
    0
  );

  const totalExpenses = postedExpenses.reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0
  );

  const taxableProfit = totalRevenue - totalExpenses;
  const sbrEligible = totalRevenue < SBR_REVENUE_LIMIT;

  let corporateTaxDue = 0;
  if (sbrEligible) {
    corporateTaxDue = 0;
  } else {
    const remainder = taxableProfit - CT_THRESHOLD;
    corporateTaxDue = remainder > 0 ? remainder * CT_RATE : 0;
  }

  return {
    totalRevenue,
    totalExpenses,
    taxableProfit,
    sbrEligible,
    corporateTaxDue,
    ctThreshold: CT_THRESHOLD,
    ctRate: CT_RATE,
  };
}

/**
 * Get current VAT quarter period.
 */
export function getCurrentVatPeriod(date = new Date()) {
  const month = date.getMonth();
  const year = date.getFullYear();
  const quarter = Math.floor(month / 3);
  const quarterStart = new Date(year, quarter * 3, 1);
  const quarterEnd = new Date(year, quarter * 3 + 3, 0);
  const dueDate = new Date(year, quarter * 3 + 3, 28);
  const qNum = quarter + 1;

  return {
    start: quarterStart.toISOString().split('T')[0],
    end: quarterEnd.toISOString().split('T')[0],
    due: dueDate.toISOString().split('T')[0],
    label: `Q${qNum} ${year}`,
    quarter: qNum,
    year,
  };
}

/**
 * Get current fiscal year.
 */
export function getCurrentFiscalYear(date = new Date()) {
  const year = date.getFullYear();
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    due: `${year + 1}-09-30`,
    label: `FY ${year}`,
    year,
  };
}

/**
 * Generate filing periods for the tracker.
 * 4 VAT quarters (current + 3 past) + 2 corporate tax periods.
 */
export function generateFilingPeriods(date = new Date()) {
  const periods = [];
  const month = date.getMonth();
  const year = date.getFullYear();
  const currentQuarter = Math.floor(month / 3);

  // VAT quarters: 3 past + current
  for (let i = 3; i >= 0; i--) {
    const q = currentQuarter - i;
    let qYear = year;
    let qNum = q;
    if (q < 0) {
      qNum = q + 4;
      qYear = year - 1;
    }
    const start = new Date(qYear, qNum * 3, 1).toISOString().split('T')[0];
    const end = new Date(qYear, qNum * 3 + 3, 0).toISOString().split('T')[0];
    const due = new Date(qYear, qNum * 3 + 3, 28).toISOString().split('T')[0];
    periods.push({
      filing_type: 'vat201',
      period_label: `VAT201 Q${qNum + 1} ${qYear}`,
      period_start: start,
      period_end: end,
      due_date: due,
    });
  }

  // Corporate tax: current FY + 1 past
  for (let i = 1; i >= 0; i--) {
    const fyYear = year - i;
    periods.push({
      filing_type: 'corporate_tax',
      period_label: `Corporate Tax FY ${fyYear}`,
      period_start: `${fyYear}-01-01`,
      period_end: `${fyYear}-12-31`,
      due_date: `${fyYear + 1}-09-30`,
    });
  }

  return periods;
}

/**
 * Determine filing status for a period.
 */
export function getFilingStatus(period, filedRecords) {
  const filed = filedRecords.find(
    (r) =>
      r.filing_type === period.filing_type &&
      r.period_label === period.period_label &&
      r.filed_date
  );

  if (filed) return 'filed';

  const today = new Date().toISOString().split('T')[0];
  const dueDate = period.due_date;

  if (today > dueDate) return 'overdue';

  const daysUntilDue = Math.ceil(
    (new Date(dueDate) - new Date(today)) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue <= 14) return 'due_soon';
  return 'upcoming';
}

export const FILING_STATUS_META = {
  filed: { label: 'Filed', color: '#34d399', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  due_soon: { label: 'Due soon', color: '#f59e0b', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20' },
  upcoming: { label: 'Upcoming', color: '#3b82f6', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/20' },
  overdue: { label: 'Overdue', color: '#ef4444', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20' },
};