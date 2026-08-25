export const CATEGORIES = [
  { id: 'buttons', name: 'Buttons', icon: 'MousePointerClick', gradient: 'from-violet-500 to-purple-600' },
  { id: 'navigation', name: 'Navigation', icon: 'Compass', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'tables', name: 'Tables', icon: 'Table', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'cards', name: 'Cards', icon: 'LayoutGrid', gradient: 'from-amber-500 to-orange-500' },
  { id: 'forms', name: 'Forms', icon: 'TextCursorInput', gradient: 'from-pink-500 to-rose-500' },
  { id: 'feedback', name: 'Feedback', icon: 'Bell', gradient: 'from-red-500 to-pink-500' },
  { id: 'data', name: 'Data Display', icon: 'BarChart3', gradient: 'from-indigo-500 to-blue-500' },
  { id: 'overlays', name: 'Overlays', icon: 'Layers', gradient: 'from-cyan-500 to-sky-500' },
  { id: 'patterns', name: 'Patterns', icon: 'Sparkles', gradient: 'from-fuchsia-500 to-purple-500' },
  { id: 'theme', name: 'Theme', icon: 'Palette', gradient: 'from-slate-500 to-gray-600' },
  { id: 'latest', name: 'Latest', icon: 'Zap', gradient: 'from-yellow-400 to-amber-500' },
];

export const PROMPT_TEXT = `Build a mobile-first UI/UX component showcase app called "UIForge" with 335+ premium components. Use React + Tailwind CSS + shadcn/ui + lucide-react icons + framer-motion.

Layout & Navigation:
- Phone-framed (max-w-md, centered) on desktop, full-bleed on mobile.
- Bottom navigation bar with 5 tabs: Home, Components, Saved, Search, Theme — animated pill indicator using framer-motion layout springs.
- Directional page transitions: tabs slide left/right based on nav order using AnimatePresence with custom direction variants (opacity + x + scale), 0.28s ease.
- Staggered list/grid reveals (staggerChildren 0.05–0.1).

Home screen:
- Dark gradient hero (slate-900 → violet-900) with app title "100+ UI Components", a "Start exploring" button, theme toggle (sun/moon), and search icon.
- 2-column category grid of cards, each with a gradient icon tile, name, and component count.
- A "Base44 prompt" card with a copy-to-clipboard button containing this very prompt.

Categories (11): Buttons, Navigation, Tables, Cards, Forms, Feedback, Data Display, Overlays, Patterns, Theme, Latest (335 components).

Components screen: Sticky header + horizontal scrollable category chips; tapping a chip filters to that section.

Saved screen: Bookmarks grouped by category; bookmark toggle on every component (persisted in localStorage).

Search screen: Search input with recent-history (persisted in localStorage, removable), quick filter chips, and category result rows.

Theme screen: Design-token gallery (colors, typography, glassmorphism, neumorphism, shadows, spacing).

Every component is wrapped in a reusable ShowcaseBlock with: numbered index badge, title, subtitle, a live preview, and a copy-to-clipboard code button + bookmark icon.

Component styles to include: glassmorphism, neumorphism, gradient buttons, liquid morphing blobs, 3D flip cards, holographic surfaces, premium pricing cards, glass wallets/players/weather/chat, iOS-style toggles, neumorphic dials/keypads/steppers, animated loaders, SVG charts, and 50+ high-end framer-motion transitions.

Tables: glass data tables, sortable headers, expandable rows, checkbox multi-select, ranking/leaderboard, heatmap grid, KPI cards, invoices, schedules, crypto token rows, order status lists, calendar grids, search-filter tables, skeleton loading tables.

State & persistence: useTheme hook, useBookmarks hook, useSearchHistory hook, useFakeLoading hook. Context providers for category, bookmark, and id-filtering state.

Design tokens: theme-based CSS variables in index.css with :root and .dark overrides; Tailwind config maps tokens to classes. All shell surfaces use token classes so the theme toggle flips the whole app.`;