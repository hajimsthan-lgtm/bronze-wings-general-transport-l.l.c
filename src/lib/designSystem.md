# Bronze Wings — App Design System

> Source of truth for every screen in the fleet-management platform.
> Every component below is already implemented in the codebase — this file
> codifies the rules so new work stays consistent without re-deriving them.

---

## 1 · Color & tint tokens

### Module accent colors
Each module owns a single accent hue used on its icon chip, active nav pill,
card top-accent, and chart series.

| Module        | Hex       | RGB (for rgba)   |
|---------------|-----------|-----------------|
| Trips         | `#1ED760` | `30,215,96`     |
| Expenses      | `#f59e0b` | `245,158,11`    |
| Maintenance   | `#06b6d4` | `6,182,212`     |
| Salary        | `#38BDF8` | `56,189,248`    |
| Vehicles      | `#6366F1` | `99,102,241`    |
| Drivers       | `#10b981` | `16,185,129`    |
| Clients       | `#f43f5e` | `244,63,94`     |
| Vendors       | `#3b82f6` | `59,130,246`    |
| Fuel          | `#14b8a6` | `20,184,166`    |
| Invoices      | `#00f2c3` | `0,242,195`     |
| Quotations    | `#14b8a6` | `20,184,166`    |
| Agreements    | `#0d9488` | `13,148,136`    |
| Reports       | `#14b8a6` | `20,184,166`    |
| Bank Rec      | `#14b8a6` | `20,184,166`    |
| Petty Cash    | `#f59e0b` | `245,158,11`    |
| Company Docs  | `#00f2c3` | `0,242,195`     |

### State / status semantics
Used for badges, pills, card accents, and inline deltas.

| State           | Hex       | Usage                                    |
|-----------------|-----------|------------------------------------------|
| Active / Paid   | `#22c55e` | success, completed, valid                |
| Pending         | `#f59e0b` | awaiting action, in-progress             |
| Overdue / Expired| `#ef4444`| past due, expired, destructive           |
| Signed / Sent    | `#3b82f6`| mid-flow, awaiting counterparty          |
| Draft           | `#94a3b8` | neutral, not yet sent                    |
| Cancelled       | `#6b7280` | voided, archived                         |

### Financial delta colors
| Delta        | Color     |
|--------------|-----------|
| Positive (+) | `#22c55e` |
| Negative (−) | `#ef4444` |

---

## 2 · Button hierarchy

**Rule: one solid filled button per page maximum — the primary action.**
Everything else is a tinted-outline or ghost button.

### Variants

| Variant          | Style                                                        | When to use                          |
|------------------|--------------------------------------------------------------|--------------------------------------|
| **Primary**      | Solid filled (module accent or brand turquoise), white text  | The single most important action     |
| **Smart action** | Tinted fill (lavender/purple), sparkle icon, slightly elevated | AI / automated batch actions         |
| **Export**       | Tinted-outline (green tint CSV, red tint PDF), icon + label  | Secondary utility, low visual weight |
| **Ghost**        | Transparent, icon only, muted text                           | Row-level quick actions, toggles     |

### Placement
- Primary action sits **right-aligned** in the page header action cluster.
- Exports and toggles sit to the **left of the primary**.
- Row-level actions are **right-aligned inside each row**, plain icon buttons.

---

## 3 · Navigation

### Top nav tabs (Dashboard / Operations / Invoices)
- Rounded **pill container** wrapping the group.
- Active tab: **light tinted background** + colored icon.
- Inactive tabs: neutral grey text/icon, transparent background.

### Sidebar nav items
- Rounded **pill shape** per item.
- Each item has its own **colored icon** (module accent).
- Active item: **solid green fill** (`#1ED760`) with white text/icon —
  distinct from the top nav's lighter tint style.
- Inactive items: transparent background, muted text.

---

## 4 · Page header component

Every page gets the same header treatment, replacing plain text-only headers.

```
┌─────────────────────────────────────────────────────────────┐
│  [icon]  Title                       [toggle] [CSV] [PDF] [+ New] │
│         short subtitle description                            │
└─────────────────────────────────────────────────────────────┘
```

- **Icon chip**: white rounded-square background, subtle border, colored icon
  centered inside — icon and color match the page's module accent.
- **Title**: bold, dark text, page name only (no redundant module label).
- **Subtitle**: one line, grey, muted — short description of what the page does.
- Sits **top-left** of the content area.
- Primary actions stay **right-aligned** for visual balance
  (left = identity, right = actions).

---

## 5 · Filter / tab strip

- **Left-aligned, compact pill group** directly below the page header —
  not a full-bleed stretched bar.
- Same rounded-pill style as sidebar / top-nav.
- Active tab gets a **light blue tint** (module accent at ~10% opacity)
  with accent-colored text.
- Inactive tabs: transparent, muted text.

---

## 6 · Card components

### Stat card (`ReportStatCard`)
- Dark glass surface with **neon top-accent line** in the module color.
- **Colored icon chip** top-left (tinted background, accent icon).
- Large **count-up animated value** (currency or plain number).
- Optional **extra** slot at the bottom: subtitle text, trend indicator,
  or sparkline.
- Hover: subtle lift + accent border glow.

### Section card (`ReportSectionCard`)
- Wraps grouped content (charts, lists, breakdowns).
- Colored top-accent line matching the section's theme.
- Optional header action (e.g. "View All →").
- Staggered fade-in entrance animation.

### Donut / ring card
- Donut chart on the left, legend list on the right.
- Legend items: color dot + label + value (tabular-nums).

### Trend card
- Area or line chart with gradient fill in the module color.
- 6-month rolling window by default.

---

## 7 · List row component

```
┌─────────────────────────────────────────────────────────────┐
│ [icon]  Title text              +AED 1,200   [paid]  [↓][✏][🗑] │
│        subtitle · meta           -AED 300                   │
└─────────────────────────────────────────────────────────────┘
```

- **Colored circular icon chip** as row avatar (not just on cards).
- **Green `+AED` / red `-AED`** inline for additions/deductions —
  reusable for any ledger-style list (expenses, invoices, bank rec, salary).
- **Small rounded status pill** per row (blue "paid", orange "pending") —
  same pill language as page-level status badges.
- **Row-level quick actions** (download / edit / delete) as small plain
  icon buttons, right-aligned, low visual weight so they don't compete
  with the row's data.

---

## 8 · Icon system

- **Single icon family**: `lucide-react` only.
- **Consistent stroke weight**: default 1.5–2px, never mixed.
- **Sizing**: `w-4 h-4` for inline/row, `w-5 h-5` for buttons,
  `w-7 h-7`–`w-9 h-9` for card icon chips.
- **Color**: inherits from parent context or uses the module accent —
  never hardcoded black/white.
- **Never** use emoji or mixed icon libraries.

---

## 9 · Status badge / pill language

| Status          | Text color | Background tint          | Dot color |
|-----------------|------------|--------------------------|-----------|
| Draft           | grey       | `rgba(148,163,184,0.12)` | grey      |
| Unsigned / Sent | blue       | `rgba(59,130,246,0.12)`  | blue      |
| Partially Paid  | amber      | `rgba(245,158,11,0.12)`  | amber     |
| Paid / Signed   | green      | `rgba(34,197,94,0.12)`   | green     |
| Overdue         | red        | `rgba(239,68,68,0.12)`   | red       |
| Cancelled       | grey       | `rgba(107,114,128,0.12)`| grey      |

- Rounded-full pill, `text-[10px]` uppercase tracking-wider, bold.
- Small dot indicator inside the pill matching the status color.

---

## 10 · Spacing & layout

- Page content padding: `px-4 md:px-6`.
- Section gap: `gap-4` (mobile) / `gap-4 lg:gap-6` (desktop).
- Card internal padding: `p-4 sm:p-5`.
- Row internal padding: `p-3` with `gap-3` between elements.
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` for stat cards.

---

## 11 · Motion

- Card entrance: staggered `fade-in-up` (0.5s, 30ms stagger).
- Row entrance: staggered `slide-in-right` (0.4s, 30ms stagger).
- Hover lift: `translateY(-2px)` with 0.3s cubic-bezier.
- Button press: `scale(0.97)` feedback.
- Respect `prefers-reduced-motion` — disable all animations when set.