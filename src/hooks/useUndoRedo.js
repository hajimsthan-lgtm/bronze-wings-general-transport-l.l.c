import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { restoreInvoiceNumberSnapshot, buildInvoiceNumberSnapshot } from '@/lib/invoiceSequence';

/**
 * Undo/Redo stack for the Invoices page.
 * Tracks invoice number changes (with full snapshots for undo) and
 * generic actions (status changes, deletes) with inverse operations.
 *
 * Each entry: { id, label, type, undo: async fn, redo: async fn, timestamp }
 */
export function useUndoRedo({ refetch, toast }) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [busy, setBusy] = useState(false);
  const idRef = useRef(0);

  const pushAction = useCallback((action) => {
    const id = ++idRef.current;
    const entry = { ...action, id, timestamp: Date.now() };
    setUndoStack((prev) => [...prev, entry]);
    setRedoStack([]); // clear redo on new action
    return entry;
  }, []);

  const undo = useCallback(async () => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1];
      setBusy(true);
      (async () => {
        try {
          await entry.undo();
          setRedoStack((r) => [...r, entry]);
          setUndoStack((p) => p.slice(0, -1));
          toast?.({ title: 'Undone', description: entry.label });
          await refetch?.();
        } catch (e) {
          toast?.({ variant: 'destructive', title: 'Undo failed', description: e.message });
        } finally {
          setBusy(false);
        }
      })();
      return prev;
    });
  }, [refetch, toast]);

  const redo = useCallback(async () => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1];
      setBusy(true);
      (async () => {
        try {
          await entry.redo();
          setUndoStack((u) => [...u, entry]);
          setRedoStack((r) => r.slice(0, -1));
          toast?.({ title: 'Redone', description: entry.label });
          await refetch?.();
        } catch (e) {
          toast?.({ variant: 'destructive', title: 'Redo failed', description: e.message });
        } finally {
          setBusy(false);
        }
      })();
      return prev;
    });
  }, [refetch, toast]);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    undoStack,
    redoStack,
    busy,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    pushAction,
    undo,
    redo,
    clear,
  };
}

/**
 * Register an invoice number change as an undoable action.
 * The undo restores the full snapshot; redo re-applies the new numbers.
 */
export async function registerNumberChangeUndo({
  undoSnapshot,
  fromNumber,
  toNumber,
  reallocated,
  invoiceId,
  pushAction,
  changedBy,
}) {
  // Build a "redo snapshot" — the state AFTER the change — by taking the
  // undo snapshot and applying the new numbers.
  const redoSnapshot = { ...undoSnapshot };
  redoSnapshot[invoiceId] = toNumber;
  (reallocated || []).forEach((r) => {
    redoSnapshot[r.invoice_id] = r.to_number;
  });

  pushAction({
    label: `Invoice number ${fromNumber} → ${toNumber}`,
    type: 'number_change',
    undo: async () => {
      await restoreInvoiceNumberSnapshot(undoSnapshot);
    },
    redo: async () => {
      await restoreInvoiceNumberSnapshot(redoSnapshot);
    },
  });
}