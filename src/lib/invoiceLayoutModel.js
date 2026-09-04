/**
 * Invoice Layout Model — block-based layout definitions for the modular
 * invoice layout system. Each invoice section is an independent, repositionable
 * block. The default layout matches the current fixed invoice arrangement.
 */

// ═══════════════════════════════════════════════════════════
// BLOCK TYPES
// ═══════════════════════════════════════════════════════════
export const BLOCK_TYPES = ['header', 'billTo', 'table', 'totals', 'terms', 'signature', 'footer'];

export const BLOCK_META = {
  header:    { label: 'Header',             icon: 'Building2',  color: '#6366f1', canDisable: false, canReorder: false, desc: 'Logo, company name, contact info, TAX INVOICE title, TRN' },
  billTo:    { label: 'Bill To',            icon: 'User',      color: '#8b5cf6', canDisable: true,  canReorder: true,  desc: 'Client name, attention, address, TRN, invoice #/date/LPO ref' },
  table:     { label: 'Line Items Table',   icon: 'Table2',    color: '#3b82f6', canDisable: false, canReorder: false, desc: 'SL No, Trip Date, Description, Qty, Unit Price, Amount, VAT, Total' },
  totals:    { label: 'Totals',             icon: 'Calculator',color: '#10b981', canDisable: true,  canReorder: true,  desc: 'Amount in Words, Subtotal, VAT, Total Amount' },
  terms:     { label: 'Terms & Conditions',  icon: 'FileText', color: '#f59e0b', canDisable: true,  canReorder: true,  desc: 'Payment terms text' },
  signature: { label: 'Signature',          icon: 'PenLine',  color: '#ec4899', canDisable: true,  canReorder: true,  desc: 'Bank details, Authorized By / Received By, signature lines' },
  footer:    { label: 'Footer',             icon: 'PanelBottom',color: '#64748b', canDisable: false, canReorder: false, desc: 'Tagline banner, page number' },
};

// ═══════════════════════════════════════════════════════════
// DEFAULT LAYOUT — matches the current fixed invoice arrangement
// ═══════════════════════════════════════════════════════════
export const DEFAULT_LAYOUT = {
  name: 'Default Layout',
  blocks: [
    { id: 'header',    type: 'header',    enabled: true },
    { id: 'billTo',    type: 'billTo',    enabled: true },
    { id: 'table',     type: 'table',     enabled: true },
    { id: 'totals',    type: 'totals',    enabled: true },
    { id: 'terms',     type: 'terms',     enabled: true },
    { id: 'signature', type: 'signature', enabled: true },
    { id: 'footer',    type: 'footer',    enabled: true },
  ],
};

// ═══════════════════════════════════════════════════════════
// VALIDATION — enforce placement constraints (Section 4)
// ═══════════════════════════════════════════════════════════
export function validateLayout(layout) {
  const errors = [];
  const warnings = [];
  if (!layout?.blocks) return { errors: ['Invalid layout'], warnings };

  const enabled = layout.blocks.filter(b => b.enabled);
  const types = enabled.map(b => b.type);

  // Header must be first
  if (types[0] !== 'header') {
    errors.push('Header must be the first block on the page');
  }

  // Footer must be last
  if (types[types.length - 1] !== 'footer') {
    errors.push('Footer must be the last block on the page');
  }

  // Table exactly once
  const tableCount = types.filter(t => t === 'table').length;
  if (tableCount === 0) {
    errors.push('Table block is required');
  } else if (tableCount > 1) {
    errors.push('Table block must appear exactly once');
  }

  // Totals and Signature must be after Table
  const tableIdx = types.indexOf('table');
  if (tableIdx >= 0) {
    for (const t of ['totals', 'signature']) {
      const idx = types.indexOf(t);
      if (idx >= 0 && idx < tableIdx) {
        errors.push(`${BLOCK_META[t].label} must appear after the Table`);
      }
    }
  }

  // Warn if Totals is disabled but Signature is enabled (signatures usually need totals context)
  if (!enabled.some(b => b.type === 'totals') && enabled.some(b => b.type === 'signature')) {
    warnings.push('Signature block without Totals — the client may not see the total amount due');
  }

  return { errors, warnings };
}

// ═══════════════════════════════════════════════════════════
// HEIGHT ESTIMATES — for pagination safety checks
// ═══════════════════════════════════════════════════════════
const BLOCK_HEIGHTS = {
  header: 34,   // letterhead (28) + tax banner (5.5) + gap
  billTo: 21,   // billing section (min 17) + gap
  totals: 17,   // amount-in-words + subtotal/VAT/total
  terms: 11,    // banner + text + gap
  signature: 28, // bank details + signatures + gaps
  footer: 0,    // footer is in the reserved zone, not in the flow
  table: 8,     // table header only; rows are dynamic
};

// Estimate total height of after-table blocks (for pagination safety)
export function estimateAfterTableHeight(layout) {
  if (!layout?.blocks) return 0;
  const enabled = layout.blocks.filter(b => b.enabled);
  const tableIdx = enabled.findIndex(b => b.type === 'table');
  if (tableIdx < 0) return 0;

  let height = 0;
  for (const block of enabled.slice(tableIdx + 1)) {
    if (block.type === 'footer') continue;
    height += BLOCK_HEIGHTS[block.type] || 0;
    height += 3; // inter-block gap
  }
  return height;
}

// Estimate total height of before-table blocks (for continuation page space)
export function estimateBeforeTableHeight(layout) {
  if (!layout?.blocks) return 0;
  const enabled = layout.blocks.filter(b => b.enabled);
  const tableIdx = enabled.findIndex(b => b.type === 'table');
  if (tableIdx < 0) return 0;

  let height = 0;
  for (const block of enabled.slice(0, tableIdx)) {
    height += BLOCK_HEIGHTS[block.type] || 0;
    height += 1; // inter-block gap
  }
  return height;
}

// ═══════════════════════════════════════════════════════════
// LAYOUT SERIALIZATION — for saving to / loading from CustomTemplate
// ═══════════════════════════════════════════════════════════
export function serializeLayout(layout) {
  return { ...layout, blocks: layout.blocks.map(b => ({ ...b })) };
}

export function deserializeLayout(config) {
  if (!config?.blocks) return DEFAULT_LAYOUT;
  return {
    name: config.name || 'Custom Layout',
    blocks: config.blocks.map(b => ({ ...b })),
  };
}