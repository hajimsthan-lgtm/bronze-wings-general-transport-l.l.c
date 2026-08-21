import { base44 } from '@/api/base44Client';

/**
 * Generates a unique import batch ID.
 * Format: IMP-{timestamp}-{random8}
 */
export function generateBatchId() {
  const ts = Date.now();
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `IMP-${ts}-${rand}`;
}

/**
 * Returns the current user's display name.
 */
export async function getCurrentUserName() {
  try {
    const me = await base44.auth.me();
    return me?.full_name || me?.email || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * Formats an ISO datetime as "21 Aug 2026 · 14:32".
 */
export function formatBatchDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return (
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
}

/**
 * Fetches all rows belonging to a given import batch.
 */
export async function fetchBatchRows(entityName, batchId) {
  return await base44.entities[entityName].filter(
    { import_batch_id: batchId },
    '-date',
    500
  );
}

/**
 * Fetches the ImportBatch metadata record for a given batch_id.
 */
export async function fetchBatchRecord(batchId) {
  const records = await base44.entities.ImportBatch.filter({ batch_id: batchId });
  return records[0] || null;
}

/**
 * Executes the undo for a given import batch.
 * Deletes only the rows tied to the exact import_batch_id — never touches
 * manually entered or previously-existing transactions.
 *
 * Returns a summary of what was removed.
 */
export async function executeBatchUndo(entityName, batchId, batchRecord) {
  const me = await base44.auth.me().catch(() => null);
  const undoneBy = me?.full_name || me?.email || 'Unknown';
  const undoneDatetime = new Date().toISOString();

  // Fetch rows to count reconciled items before deletion
  const rows = await fetchBatchRows(entityName, batchId);
  const reconciledCount = rows.filter((r) => r.reconciled).length;

  // Delete only rows tied to this exact batch
  await base44.entities[entityName].deleteMany({ import_batch_id: batchId });

  // Update the ImportBatch record to "undone" with audit info
  if (batchRecord) {
    await base44.entities.ImportBatch.update(batchRecord.id, {
      status: 'undone',
      undone_by: undoneBy,
      undone_datetime: undoneDatetime,
      rows_removed: rows.length,
      reconciled_removed: reconciledCount,
    });
  }

  return {
    rowsRemoved: rows.length,
    reconciledRemoved: reconciledCount,
    undoneBy,
    undoneDatetime,
  };
}