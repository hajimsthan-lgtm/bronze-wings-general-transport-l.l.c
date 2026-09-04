/**
 * Invoice Layout Model — block-based layout definitions for the modular
 * invoice layout system. Each invoice section is an independent, repositionable
 * block with configurable style, spacing, borders, background, and (for the
 * table) column widths.
 */

// ═══════════════════════════════════════════════════════════
// BLOCK TYPES
// ═══════════════════════════════════════════════════════════
export const BLOCK_TYPES = ['header', 'billTo', 'table', 'totals', 'terms', 'signature', 'footer'];

export const BLOCK_META = {
  header:    { label: 'Header',             icon: 'Building2',  color: '#6366f1', canDisable: true,  canReorder: true,  desc: 'Logo, company name, contact info, TAX INVOICE title, TRN' },
  billTo:    { label: 'Bill To',            icon: 'User',       color: '#8b5cf6', canDisable: true,  canReorder: true,  desc: 'Client name, attention, address, TRN, invoice #/date/LPO ref' },
  table:     { label: 'Line Items Table',   icon: 'Table2',     color: '#3b82f6', canDisable: true,  canReorder: true,  desc: 'SL No, Trip Date, Description, Qty, Unit Price, Amount, VAT, Total' },
  totals:    { label: 'Totals',             icon: 'Calculator', color: '#10b981', canDisable: true,  canReorder: true,  desc: 'Amount in Words, Subtotal, VAT, Total Amount' },
  terms:     { label: 'Terms & Conditions',  icon: 'FileText',  color: '#f59e0b', canDisable: true,  canReorder: true,  desc: 'Payment terms text' },
  signature: { label: 'Signature',          icon: 'PenLine',    color: '#ec4899', canDisable: true,  canReorder: true,  desc: 'Bank details, Authorized By / Received By, signature lines' },
  footer:    { label: 'Footer',             icon: 'PanelBottom',color: '#64748b', canDisable: true,  canReorder: true,  desc: 'Tagline banner, page number' },
};

// ═══════════════════════════════════════════════════════════
// STYLE OPTIONS
// ═══════════════════════════════════════════════════════════
export const FONT_FAMILIES = [
  { value: 'times', label: 'Times New Roman' },
  { value: 'helvetica', label: 'Helvetica / Arial' },
  { value: 'courier', label: 'Courier' },
];

export const FONT_WEIGHTS = [
  { value: 'normal', label: 'Regular' },
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
  { value: 'bolditalic', label: 'Bold Italic' },
];

export const ALIGNMENTS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

// Default text style per block type
export const BLOCK_DEFAULT_STYLES = {
  header:    { fontFamily: 'times', fontSize: 10, fontWeight: 'bold',   color: '#000000', align: 'left',   lineHeight: 1.2 },
  billTo:    { fontFamily: 'times', fontSize: 10, fontWeight: 'normal', color: '#000000', align: 'left',   lineHeight: 1.3 },
  table:     { fontFamily: 'times', fontSize: 9,  fontWeight: 'normal', color: '#000000', align: 'left',   lineHeight: 1.2 },
  totals:    { fontFamily: 'times', fontSize: 10, fontWeight: 'normal', color: '#000000', align: 'right',  lineHeight: 1.3 },
  terms:     { fontFamily: 'times', fontSize: 9,  fontWeight: 'normal', color: '#333333', align: 'center', lineHeight: 1.3 },
  signature: { fontFamily: 'times', fontSize: 10, fontWeight: 'normal', color: '#000000', align: 'left',   lineHeight: 1.3 },
  footer:    { fontFamily: 'times', fontSize: 8,  fontWeight: 'normal', color: '#666666', align: 'center', lineHeight: 1.2 },
};

// Default table columns — Per Trip (percentage of table width)
export const DEFAULT_COLUMNS = [
  { key: 'sl',     label: 'SL No',      width: 7,  visible: true, locked: true },
  { key: 'date',   label: 'Trip Date',  width: 12, visible: true },
  { key: 'desc',   label: 'Description',width: 28, visible: true },
  { key: 'qty',    label: 'Qty',        width: 7,  visible: true },
  { key: 'price',  label: 'Unit Price', width: 11, visible: true },
  { key: 'amount', label: 'Amount',     width: 11, visible: true },
  { key: 'vat',    label: 'VAT',        width: 10, visible: true },
  { key: 'total',  label: 'Total',      width: 14, visible: true, locked: true },
];

// Default table columns — Monthly
export const DEFAULT_COLUMNS_MONTHLY = [
  { key: 'sl',     label: 'SL No',      width: 7,  visible: true, locked: true },
  { key: 'date',   label: 'Month',      width: 12, visible: true },
  { key: 'desc',   label: 'Description',width: 28, visible: true },
  { key: 'qty',    label: 'Qty',        width: 7,  visible: true },
  { key: 'price',  label: 'Unit Price', width: 11, visible: true },
  { key: 'amount', label: 'Amount',     width: 11, visible: true },
  { key: 'vat',    label: 'VAT',        width: 10, visible: true },
  { key: 'total',  label: 'Total',      width: 14, visible: true, locked: true },
];

// Get default columns for a given invoice type
export function getDefaultColumns(invoiceType) {
  return (invoiceType === 'monthly' ? DEFAULT_COLUMNS_MONTHLY : DEFAULT_COLUMNS).map(c => ({ ...c }));
}

// Block height estimates (mm) — for pagination + background rendering
export const BLOCK_HEIGHTS = {
  header: 34,
  billTo: 21,
  totals: 17,
  terms: 11,
  signature: 28,
  footer: 0,
  table: 8,
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function makeBlock(id, type) {
  const block = {
    id,
    type,
    enabled: true,
    style: { ...BLOCK_DEFAULT_STYLES[type] },
    spacing: { paddingTop: 0, paddingBottom: 0 },
    border: { top: false, bottom: false },
    background: { enabled: false, color: '#f5f5f5' },
  };
  if (type === 'table') {
    block.columns = DEFAULT_COLUMNS.map(c => ({ ...c }));
  }
  return block;
}

// ═══════════════════════════════════════════════════════════
// DEFAULT LAYOUT
// ═══════════════════════════════════════════════════════════
export const DEFAULT_LAYOUT = {
  name: 'Default Layout',
  blocks: [
    makeBlock('header',    'header'),
    makeBlock('billTo',    'billTo'),
    makeBlock('table',     'table'),
    makeBlock('totals',    'totals'),
    makeBlock('terms',     'terms'),
    makeBlock('signature', 'signature'),
    makeBlock('footer',    'footer'),
  ],
};

// ═══════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════
export function validateLayout(layout) {
  const errors = [];
  const warnings = [];
  if (!layout?.blocks) return { errors: ['Invalid layout'], warnings };

  const enabled = layout.blocks.filter(b => b.enabled);
  const types = enabled.map(b => b.type);

  // Header must be first (only if enabled)
  if (types.includes('header') && types[0] !== 'header') errors.push('Header must be the first block on the page');
  // Footer must be last (only if enabled)
  if (types.includes('footer') && types[types.length - 1] !== 'footer') errors.push('Footer must be the last block on the page');

  const tableCount = types.filter(t => t === 'table').length;
  if (tableCount === 0) errors.push('Table block is required');
  else if (tableCount > 1) errors.push('Table block must appear exactly once');

  const tableIdx = types.indexOf('table');
  if (tableIdx >= 0) {
    for (const t of ['totals', 'signature']) {
      const idx = types.indexOf(t);
      if (idx >= 0 && idx < tableIdx) errors.push(`${BLOCK_META[t].label} must appear after the Table`);
    }
  }

  if (!enabled.some(b => b.type === 'totals') && enabled.some(b => b.type === 'signature')) {
    warnings.push('Signature block without Totals — the client may not see the total amount due');
  }

  return { errors, warnings };
}

// ═══════════════════════════════════════════════════════════
// HEIGHT ESTIMATES (include spacing)
// ═══════════════════════════════════════════════════════════
export function estimateAfterTableHeight(layout) {
  if (!layout?.blocks) return 0;
  const enabled = layout.blocks.filter(b => b.enabled);
  const tableIdx = enabled.findIndex(b => b.type === 'table');
  if (tableIdx < 0) return 0;
  let height = 0;
  for (const block of enabled.slice(tableIdx + 1)) {
    if (block.type === 'footer') continue;
    height += BLOCK_HEIGHTS[block.type] || 0;
    height += 3;
    height += (block.spacing?.paddingTop || 0) + (block.spacing?.paddingBottom || 0);
  }
  return height;
}

export function estimateBeforeTableHeight(layout) {
  if (!layout?.blocks) return 0;
  const enabled = layout.blocks.filter(b => b.enabled);
  const tableIdx = enabled.findIndex(b => b.type === 'table');
  if (tableIdx < 0) return 0;
  let height = 0;
  for (const block of enabled.slice(0, tableIdx)) {
    height += BLOCK_HEIGHTS[block.type] || 0;
    height += 1;
    height += (block.spacing?.paddingTop || 0) + (block.spacing?.paddingBottom || 0);
  }
  return height;
}

// ═══════════════════════════════════════════════════════════
// SERIALIZATION (backward-compatible)
// ═══════════════════════════════════════════════════════════
export function serializeLayout(layout) {
  return JSON.parse(JSON.stringify(layout));
}

export function deserializeLayout(config) {
  if (!config?.blocks) {
    return { ...DEFAULT_LAYOUT, blocks: DEFAULT_LAYOUT.blocks.map(b => ({
      ...b, style: { ...b.style }, columns: b.columns?.map(c => ({ ...c })),
    }))};
  }
  return {
    name: config.name || 'Custom Layout',
    blocks: config.blocks.map(b => {
      const defaultBlock = DEFAULT_LAYOUT.blocks.find(db => db.type === b.type) || makeBlock(b.id || b.type, b.type);
      return {
        ...b,
        style:     { ...defaultBlock.style,     ...(b.style     || {}) },
        spacing:   { paddingTop: 0, paddingBottom: 0, ...(b.spacing   || {}) },
        border:    { top: false, bottom: false,           ...(b.border    || {}) },
        background:{ enabled: false, color: '#f5f5f5',    ...(b.background|| {}) },
        ...(b.type === 'table' ? { columns: (b.columns || defaultBlock.columns || []).map(c => ({ ...c })) } : {}),
      };
    }),
  };
}

// ═══════════════════════════════════════════════════════════
// MOVEMENT HELPERS
// ═══════════════════════════════════════════════════════════
export function canMoveUp(layout, index) {
  if (index <= 0) return { can: false, reason: 'Already at the top' };
  const newBlocks = Array.from(layout.blocks);
  [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
  const v = validateLayout({ ...layout, blocks: newBlocks });
  if (v.errors.length > 0) return { can: false, reason: v.errors[0] };
  return { can: true, reason: '' };
}

export function canMoveDown(layout, index) {
  if (index >= layout.blocks.length - 1) return { can: false, reason: 'Already at the bottom' };
  const newBlocks = Array.from(layout.blocks);
  [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
  const v = validateLayout({ ...layout, blocks: newBlocks });
  if (v.errors.length > 0) return { can: false, reason: v.errors[0] };
  return { can: true, reason: '' };
}

export function moveBlock(layout, index, direction) {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= layout.blocks.length) return layout;
  const newBlocks = Array.from(layout.blocks);
  [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
  return { ...layout, blocks: newBlocks };
}

// ═══════════════════════════════════════════════════════════
// STYLE / CONFIG HELPERS
// ═══════════════════════════════════════════════════════════
export function resetBlockStyle(layout, blockId) {
  const block = layout.blocks.find(b => b.id === blockId);
  if (!block) return layout;
  return {
    ...layout,
    blocks: layout.blocks.map(b => b.id === blockId ? { ...b, style: { ...BLOCK_DEFAULT_STYLES[b.type] } } : b),
  };
}

export function applyStyleToAll(layout, style) {
  return { ...layout, blocks: layout.blocks.map(b => ({ ...b, style: { ...b.style, ...style } })) };
}