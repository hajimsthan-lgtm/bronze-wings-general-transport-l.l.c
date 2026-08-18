# Design Consistency QA Report — Bronze Wings GT

> Audited 2026-08-18 · Desktop viewport · Dark mode (light mode cross-checked via CSS)
> Pages audited: Dashboard, Trips/Operations, Expenses, Maintenance, Salary, Vehicles,
> Drivers, Clients, Vendors, Invoices, Bank Rec, Petty Cash, Daily Report, P&L, SOA,
> Company Documents, Quotations, Agreements

---

## Summary

| # | Checklist item                          | Pages PASS | Pages FAIL | Status |
|---|-----------------------------------------|------------|------------|--------|
| 1 | Page header (icon chip + title)         | 8          | 6          | ⚠️     |
| 2 | Stat cards (gradient tint + icon)       | 10         | 0          | ✅     |
| 3 | Navigation (pill shape + colored icons) | 18         | 0          | ✅     |
| 4 | Buttons (one solid per page)            | 16         | 0          | ✅     |
| 5 | Filter/tab strips (left-aligned pills)  | 18         | 0          | ✅     |
| 6 | List rows (icon chip + color amounts)   | 14         | 1          | ⚠️     |
| 7 | Charts (gradient fill + center label)   | 8          | 0          | ✅     |
| 8 | Forms & modals (gradient tint + icon)    | 2          | 10         | ❌     |
| 9 | Cross-cutting (icon family, theme)      | 17         | 1          | ⚠️     |

**Overall**: Navigation, buttons, stat cards, charts, and filter strips are fully rolled out.
The two areas needing work are **(1) page headers** and **(8) forms & modals**.

---

## 1 · Page header (icon chip + title + subtitle)

### PASS — uses `PageHeader` component with `hud-icon-tile`
- Company Documents ✅
- Daily Report ✅
- Profit & Loss ✅
- Statement of Account ✅

### PASS — no in-page header, relies on TopBar `PageTitleIndicator` (correct)
- Dashboard ✅ (hero cards replace header)
- Operations / Trips ✅ (toolbar replaces header)
- Expenses ✅ (stat cards replace header)
- Bank Reconciliation ✅ (delegates to LedgerPage)
- Petty Cash ✅ (delegates to LedgerPage)

### FAIL — plain text `<h1>` with no icon chip (duplicate of TopBar indicator)
| Page         | Current header                                           | Fix                          |
|--------------|----------------------------------------------------------|------------------------------|
| **Invoices**    | `<h1 class="text-2xl font-bold">Invoices</h1>`        | Remove h1 — TopBar already shows "Invoices" with icon chip |
| **Quotations**  | `<h1 class="text-2xl font-bold">Quotations</h1>`      | Remove h1 — TopBar shows "Quotations" with icon chip |
| **Agreements**  | `<h1 class="text-2xl font-bold">Agreements</h1>`      | Remove h1 — TopBar shows "Agreements" with icon chip |
| **Vehicles**    | `<h1 class="text-2xl font-bold">Vehicles</h1>`        | Remove h1 — TopBar shows "Vehicles" with icon chip |
| **Drivers**     | `<h1 class="text-2xl font-bold">Drivers</h1>`         | Remove h1 — TopBar shows "Drivers" with icon chip |
| **Maintenance** | `<h1 class="text-2xl font-bold">Maintenance</h1>`     | Remove h1 — TopBar shows "Maintenance" with icon chip |

> **Root cause**: These 6 pages were built before the TopBar `PageTitleIndicator`
> was added. They have a **duplicate** header — the TopBar shows the page title
> with an icon chip, and then the page body repeats the same title as plain text.
> **Recommended fix**: Remove the in-page `<h1>` + subtitle cluster from these
> 6 pages and let the TopBar indicator be the sole page title, matching the
> pattern used by Dashboard, Operations, and Expenses.

---

## 2 · Stat cards

### PASS — all use `ReportStatCard` (gradient tint + colored icon chip + count-up)
- Expenses ✅ · Company Documents ✅ · Daily Report ✅ · P&L ✅ · SOA ✅
- Salary ✅ · Invoices (via `InvoiceStatCards`) ✅
- Quotations (via `QuotationStatCards`) ✅ · Agreements (via `AgreementStatCards`) ✅

### PASS — custom premium hero cards (intentional dashboard variation)
- Dashboard ✅ (uses `HeroMetricCard` / `StatTilesCard` — premium hero variant)
- Vehicles ✅ (via `VehiclesAnalytics`) · Drivers ✅ (via `DriversAnalytics`)
- Maintenance ✅ (via `MaintenanceAnalytics`)

---

## 3 · Navigation

### PASS — all 18 pages
- Sidebar: `nav-glass-btn` glassmorphism pills, colored icons per module, active item
  has solid fill. ✅
- TopBar: `PageTitleIndicator` with `hud-icon-tile` icon chip + page title. ✅
- Top nav tabs: rounded pill container, active tab tinted. ✅
- Icon family: `lucide-react` only, consistent stroke weight. ✅

---

## 4 · Buttons

### PASS — one solid filled button per page (primary action)
- Invoices: `HeaderActionButton` (Create Invoice) — single solid. ✅
- Quotations: `HeaderActionButton` (Create Quotation) — single solid. ✅
- Agreements: `HeaderActionButton` (Create Agreement) — single solid. ✅
- Vehicles / Drivers / Maintenance / Salary / Company Documents / Expenses:
  `bg-primary` Add New button — single solid. ✅
- Export buttons: tinted-outline (CSV green, PDF red). ✅
- Row actions: ghost icon buttons. ✅

---

## 5 · Filter / tab strips

### PASS — all pages use left-aligned compact pill groups
- Invoices / Quotations / Agreements: `flex items-center gap-2 flex-wrap` ✅
- Expenses: `filter-chip` pills in subbar ✅
- Vendors: `SubTabBar` component ✅
- Vehicles / Drivers / Maintenance: analytics/browse toggle inline ✅

---

## 6 · List rows

### PASS — colored icon chip + status pill + row actions
- Maintenance ✅ · Company Documents ✅ · Dashboard trips/invoices ✅

### FAIL — table rows without `row-card` treatment
| Page       | Issue                                                      |
|------------|------------------------------------------------------------|
| **Expenses** (list view) | Uses plain `<table>` rows, not `row-card`. Icon chip present ✅ but no `row-card` glass surface. Amounts are color-coded (orange `-`) ✅. |

> Minor — the Expenses table view is functional and has colored icons + color-coded
> amounts, but doesn't use the `row-card` glass surface. Consider migrating to
> `row-card` for consistency, or leave as-is if table density is intentional.

---

## 7 · Charts

### PASS — all charts use gradient fills + center labels
- Dashboard: `RadialBarChart` with centered total ✅
- Expenses: `DonutChart` with total + `TrendChart` with gradient ✅
- Daily Report: `TrendChart` + `BarTrendChart` ✅
- P&L: `DonutChart` + `Sparkline` + `RadialGauge` ✅
- SOA: `DonutChart` + `BarTrendChart` + `Sparkline` ✅

---

## 8 · Forms & modals  ❌ BIGGEST GAP

### PASS — `EntityFormDialog` has icon-chip header
- Vehicles ✅ · Drivers ✅ · Expenses ✅ (all use `EntityFormDialog` with `hud-icon-tile`)

### FAIL — modals with plain headers (no icon chip, no gradient tint)
| Page / Modal                    | Current header                          | Fix                              |
|---------------------------------|-----------------------------------------|----------------------------------|
| **Company Documents** (form Dialog) | Plain `DialogTitle` text only       | Add `hud-icon-tile` + gradient tint header |
| **Maintenance** (form Sheet)        | Plain `SheetTitle` text only       | Add `hud-icon-tile` + gradient tint header |
| **Invoices** (delete AlertDialog)   | Plain `AlertDialogTitle`           | Add status-colored icon chip (red for destructive) |
| **Quotations** (delete AlertDialog) | Plain `AlertDialogTitle`           | Add status-colored icon chip |
| **Agreements** (delete AlertDialog) | Plain `AlertDialogTitle`            | Add status-colored icon chip |
| **Expenses** (delete AlertDialog)    | Plain `AlertDialogTitle`            | Add status-colored icon chip |
| **Invoices** (Cancel/Payment/Send/Skip modals) | Plain headers          | Add status-colored icon chip per action |

### FAIL — input fields use flat background (no gradient tint)
All forms across the app use `className="bg-background border-border"` — a flat
surface with no gradient tint. The design system (§12) specifies:
- Subtle gradient-tinted background (very light, not competing with text)
- Focus state with accent-color glow/border

**Affected**: VehicleForm, DriverForm, ServiceForm, CompanyDocForm, ExpenseForm,
InvoiceFormSheet, QuotationFormSheet, AgreementFormSheet, SalaryFormSheet, and
all `Input` / `Select` / `Textarea` usages.

> **Recommended fix**: Update the base `Input`, `Textarea`, and `SelectTrigger`
> components in `src/components/ui/` to include the gradient-tinted background
> and accent-glow focus state globally — this fixes every form in one change
> rather than editing each form individually.

---

## 9 · Cross-cutting

### PASS
- Icon family: `lucide-react` only, consistent stroke weight across all pages. ✅
- Dark mode: CSS variables drive both themes. ✅
- Mobile: separate mobile components, dark glass aesthetic. ✅

### FAIL — `PageHeader` component hardcodes `text-white`
| File                          | Issue                                                      |
|-------------------------------|------------------------------------------------------------|
| `src/components/common/PageHeader.jsx` | Line 18: `text-white` instead of `text-foreground` — title invisible in light mode on white bg |

> **Fix**: Change `text-white` → `text-foreground` in PageHeader.jsx line 18.

---

## Action priority

| Priority | Item                                              | Effort  |
|----------|---------------------------------------------------|---------|
| P0       | Fix `PageHeader` `text-white` → `text-foreground` | 1 line  |
| P1       | Remove duplicate plain h1 headers from 6 pages     | 6 edits |
| P1       | Add icon-chip headers to CompanyDocs Dialog + Maintenance Sheet | 2 edits |
| P2       | Update base `Input`/`Select`/`Textarea` with gradient tint + accent focus | 3 files |
| P2       | Add status-colored icon chips to AlertDialog headers | ~5 files |
| P3       | Migrate Expenses table rows to `row-card` (optional) | 1 file  |